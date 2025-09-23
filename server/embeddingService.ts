import OpenAI from 'openai';
import { storage } from './storage';
import { insertEmbeddingSchema, insertKnowledgeItemSchema } from '@shared/schema';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY,
});

interface ChunkData {
  text: string;
  metadata: {
    chunkIndex: number;
    totalChunks: number;
    startPosition: number;
    endPosition: number;
    [key: string]: any;
  };
}

interface ProcessingResult {
  totalChunks: number;
  embeddingsCount: number;
  itemCount: number;
}

export class EmbeddingService {
  private static readonly CHUNK_SIZE = 1500; // Characters per chunk
  private static readonly CHUNK_OVERLAP = 200; // Overlap between chunks
  private static readonly EMBEDDING_MODEL = 'text-embedding-3-small';
  private static readonly MAX_CHUNKS_PER_FILE = 300; // Prevent memory issues
  private static readonly BATCH_SIZE = 50; // Batch embeddings for efficiency

  /**
   * Chunk text into manageable pieces with overlap
   */
  static chunkText(text: string): ChunkData[] {
    const chunks: ChunkData[] = [];
    const textLength = text.length;
    let position = 0;
    let chunkIndex = 0;

    while (position < textLength) {
      const endPosition = Math.min(position + this.CHUNK_SIZE, textLength);
      const chunkText = text.slice(position, endPosition);
      
      chunks.push({
        text: chunkText,
        metadata: {
          chunkIndex,
          totalChunks: 0, // Will be updated after all chunks are created
          startPosition: position,
          endPosition,
        }
      });

      // Move position forward, accounting for overlap
      position = endPosition - this.CHUNK_OVERLAP;
      if (position >= textLength) break;
      chunkIndex++;
    }

    // Update total chunks count
    chunks.forEach(chunk => {
      chunk.metadata.totalChunks = chunks.length;
    });

    return chunks;
  }

  /**
   * Generate embeddings for text using OpenAI
   */
  static async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
        model: this.EMBEDDING_MODEL,
        input: text,
        encoding_format: "float",
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error(`Failed to generate embedding: ${error}`);
    }
  }

  /**
   * Generate embeddings in batches for efficiency
   */
  static async generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
    try {
      const response = await openai.embeddings.create({
        model: this.EMBEDDING_MODEL,
        input: texts,
        encoding_format: "float",
      });

      return response.data.map(item => item.embedding);
    } catch (error) {
      console.error('Error generating batch embeddings:', error);
      throw new Error(`Failed to generate batch embeddings: ${error}`);
    }
  }

  /**
   * Process a text file: chunk it, generate embeddings, and store in database
   */
  static async processTextFile(
    knowledgeBaseId: string,
    filename: string,
    content: string,
    mimeType: string,
    metadata: Record<string, any> = {}
  ): Promise<ProcessingResult> {
    try {
      console.log(`🔄 Processing file: ${filename} (${content.length} characters)`);
      
      // Chunk the text
      const chunks = this.chunkText(content);
      
      // Check if file is too large (prevent memory issues)
      if (chunks.length > this.MAX_CHUNKS_PER_FILE) {
        throw new Error(`File too large: ${chunks.length} chunks (max ${this.MAX_CHUNKS_PER_FILE}). Please upload smaller files.`);
      }
      
      console.log(`📄 Created ${chunks.length} chunks from ${filename}`);

      let itemCount = 0;
      let embeddingsCount = 0;

      // Process chunks in batches to manage memory
      for (let batchStart = 0; batchStart < chunks.length; batchStart += this.BATCH_SIZE) {
        const batchEnd = Math.min(batchStart + this.BATCH_SIZE, chunks.length);
        const batchChunks = chunks.slice(batchStart, batchEnd);
        
        console.log(`🔍 Processing batch ${Math.floor(batchStart / this.BATCH_SIZE) + 1}/${Math.ceil(chunks.length / this.BATCH_SIZE)} (chunks ${batchStart + 1}-${batchEnd})`);

        // Create knowledge items for this batch
        const knowledgeItems: any[] = [];
        for (const chunk of batchChunks) {
          const knowledgeItemData = insertKnowledgeItemSchema.parse({
            knowledgeBaseId,
            type: 'chunk',
            title: `${filename} - Chunk ${chunk.metadata.chunkIndex + 1}`,
            content: chunk.text,
            metadata: {
              ...metadata,
              mimeType,
              filename,
              isChunk: true,
              chunkIndex: chunk.metadata.chunkIndex,
              totalChunks: chunk.metadata.totalChunks,
              startPosition: chunk.metadata.startPosition,
              endPosition: chunk.metadata.endPosition,
              originalFileSize: content.length,
              processedAt: new Date().toISOString()
            }
          });

          const knowledgeItem = await storage.createKnowledgeItem(knowledgeItemData);
          knowledgeItems.push(knowledgeItem);
          itemCount++;
        }

        // Generate embeddings in batch
        try {
          const batchTexts = batchChunks.map(chunk => chunk.text);
          const batchEmbeddings = await this.generateEmbeddingsBatch(batchTexts);
          
          // Store embeddings
          for (let i = 0; i < batchEmbeddings.length; i++) {
            const embedding = batchEmbeddings[i];
            const chunk = batchChunks[i];
            const knowledgeItem = knowledgeItems[i];
            
            const embeddingData = insertEmbeddingSchema.parse({
              knowledgeItemId: knowledgeItem.id,
              chunkIndex: chunk.metadata.chunkIndex,
              chunkText: chunk.text,
              vector: JSON.stringify(embedding), // Store as JSON string
              metadata: {
                chunkIndex: chunk.metadata.chunkIndex,
                chunkLength: chunk.text.length,
                generatedAt: new Date().toISOString(),
                model: this.EMBEDDING_MODEL
              }
            });

            await storage.createEmbedding(embeddingData);
            embeddingsCount++;
          }
          
          console.log(`✅ Generated ${batchEmbeddings.length} embeddings for batch`);
        } catch (embeddingError) {
          console.error(`❌ Failed to generate embeddings for batch:`, embeddingError);
          // Continue processing other batches even if one fails
        }

        // Small delay between batches to avoid rate limiting
        if (batchEnd < chunks.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      console.log(`✅ Successfully processed ${filename}: ${itemCount} items, ${embeddingsCount} embeddings`);

      return {
        totalChunks: chunks.length,
        embeddingsCount,
        itemCount
      };
    } catch (error) {
      console.error('Error processing text file:', error);
      throw error;
    }
  }

  /**
   * Search for similar content using vector similarity
   */
  static async searchSimilar(
    knowledgeBaseId: string,
    query: string,
    limit: number = 10,
    threshold: number = 0.7
  ): Promise<any[]> {
    try {
      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query);
      
      // Search for similar embeddings in the database
      // Note: This is a placeholder - actual vector similarity search 
      // would require a vector database or similarity function
      const results = await storage.searchEmbeddings(queryEmbedding, limit, knowledgeBaseId);
      
      return results.filter(result => result.similarity > threshold);
    } catch (error) {
      console.error('Error searching similar content:', error);
      throw error;
    }
  }

  /**
   * Extract text content from different file types
   */
  static extractTextFromFile(buffer: Buffer, mimeType: string, filename: string): string {
    try {
      if (mimeType.startsWith('text/') || mimeType === 'application/json') {
        return buffer.toString('utf-8');
      }
      
      if (mimeType === 'application/javascript' || mimeType === 'application/typescript') {
        return buffer.toString('utf-8');
      }

      // For unsupported types, return filename and basic info
      return `File: ${filename}\nType: ${mimeType}\nSize: ${buffer.length} bytes\n\nThis file type is not yet supported for text extraction.`;
    } catch (error) {
      console.error('Error extracting text from file:', error);
      return `Error extracting text from ${filename}: ${error}`;
    }
  }

  /**
   * Process uploaded file with automatic text extraction and chunking
   */
  static async processUploadedFile(
    knowledgeBaseId: string,
    file: Express.Multer.File
  ): Promise<ProcessingResult> {
    try {
      console.log(`📁 Processing uploaded file: ${file.originalname}`);
      
      // Extract text content
      const textContent = this.extractTextFromFile(
        file.buffer,
        file.mimetype,
        file.originalname
      );

      // Process the text content
      return await this.processTextFile(
        knowledgeBaseId,
        file.originalname,
        textContent,
        file.mimetype,
        {
          uploadedAt: new Date().toISOString(),
          originalSize: file.size,
          encoding: file.encoding
        }
      );
    } catch (error) {
      console.error('Error processing uploaded file:', error);
      throw error;
    }
  }
}