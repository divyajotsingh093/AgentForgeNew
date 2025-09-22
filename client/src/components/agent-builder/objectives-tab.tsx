import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useFormContext, useFieldArray } from "react-hook-form";

export default function ObjectivesTab() {
  const form = useFormContext();
  const [promptTemplates] = useState([
    { id: "assistant", name: "General Assistant", description: "Helpful AI assistant for general tasks" },
    { id: "analyst", name: "Data Analyst", description: "Analyze and interpret data insights" },
    { id: "writer", name: "Content Writer", description: "Create engaging written content" },
    { id: "researcher", name: "Research Assistant", description: "Research and gather information" },
    { id: "customer-service", name: "Customer Service", description: "Handle customer inquiries and support" }
  ]);

  const { fields: variables, append: addVariable, update: updateVariable, remove: removeVariable } = useFieldArray({
    control: form.control,
    name: "variables"
  });

  const handleAddVariable = () => {
    addVariable({ name: "", description: "", type: "string" });
  };

  const handleUpdateVariable = (index: number, field: string, value: string) => {
    const variable = variables[index];
    updateVariable(index, { ...variable, [field]: value });
  };

  const handleRemoveVariable = (index: number) => {
    removeVariable(index);
  };

  return (
    <div className="space-y-6">
      {/* Prompt Engineering Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <i className="fas fa-magic text-primary"></i>
            Prompt Engineering
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Template Selection */}
          <div>
            <Label htmlFor="prompt-template">Start with a Template</Label>
            <Select>
              <SelectTrigger data-testid="select-prompt-template">
                <SelectValue placeholder="Choose a prompt template or start from scratch" />
              </SelectTrigger>
              <SelectContent>
                {promptTemplates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div>
                      <div className="font-medium">{template.name}</div>
                      <div className="text-sm text-muted-foreground">{template.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* System Prompt */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="system-prompt">System Prompt *</Label>
              <Badge variant="outline">Tokens: ~250</Badge>
            </div>
            <Textarea
              {...form.register("systemPrompt")}
              id="system-prompt"
              placeholder="You are a helpful AI assistant that..."
              rows={6}
              className="font-mono text-sm"
              data-testid="textarea-system-prompt"
            />
            {form.formState.errors.systemPrompt && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.systemPrompt.message}
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              Define the agent's role, personality, and core instructions. Use variables like {`{{user_name}}`} for dynamic content.
            </p>
          </div>

          {/* User Message Template */}
          <div>
            <Label htmlFor="user-template">User Message Template</Label>
            <Textarea
              {...form.register("userTemplate")}
              id="user-template"
              placeholder="Task: {{task}}\nContext: {{context}}\n\nPlease help me with this request."
              rows={4}
              className="font-mono text-sm"
              data-testid="textarea-user-template"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Template for formatting user inputs. Leave empty to use raw user input.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Variables & Parameters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <i className="fas fa-code text-primary"></i>
            Variables & Parameters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {variables.map((variable, index) => (
              <div key={index} className="flex items-center gap-4 p-4 border border-border rounded-lg">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    {...form.register(`variables.${index}.name`)}
                    placeholder="Variable name"
                    data-testid={`input-variable-name-${index}`}
                  />
                  <Input
                    {...form.register(`variables.${index}.description`)}
                    placeholder="Description"
                    data-testid={`input-variable-description-${index}`}
                  />
                  <Select 
                    value={form.watch(`variables.${index}.type`) || "string"}
                    onValueChange={(value) => form.setValue(`variables.${index}.type`, value)}
                  >
                    <SelectTrigger data-testid={`select-variable-type-${index}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="string">String</SelectItem>
                      <SelectItem value="text">Text (Multi-line)</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="boolean">Boolean</SelectItem>
                      <SelectItem value="array">Array</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleRemoveVariable(index)}
                  data-testid={`button-remove-variable-${index}`}
                >
                  <i className="fas fa-trash text-destructive"></i>
                </Button>
              </div>
            ))}
            
            <Button 
              variant="outline" 
              onClick={handleAddVariable}
              className="w-full"
              data-testid="button-add-variable"
            >
              <i className="fas fa-plus mr-2"></i>
              Add Variable
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Few-Shot Examples */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <i className="fas fa-lightbulb text-primary"></i>
            Few-Shot Examples
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              {...form.register("fewShotExamples")}
              placeholder="Provide examples of ideal agent responses..."
              rows={6}
              className="font-mono text-sm"
              data-testid="textarea-few-shots"
            />
            <p className="text-sm text-muted-foreground">
              Add examples of high-quality interactions to improve agent performance. Use the format:
              User: [example input] | Assistant: [ideal response]
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <i className="fas fa-cogs text-primary"></i>
            Advanced Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="max-tokens">Max Response Tokens</Label>
            <Input
              {...form.register("maxTokens", { valueAsNumber: true })}
              id="max-tokens"
              type="number"
              placeholder="2048"
              data-testid="input-max-tokens"
            />
          </div>
          <div>
            <Label htmlFor="temperature">Temperature (Creativity)</Label>
            <Input
              {...form.register("temperature", { valueAsNumber: true })}
              id="temperature"
              type="number"
              step="0.1"
              min="0"
              max="2"
              placeholder="0.7"
              data-testid="input-temperature"
            />
          </div>
          <div>
            <Label htmlFor="top-p">Top P (Focus)</Label>
            <Input
              {...form.register("topP", { valueAsNumber: true })}
              id="top-p"
              type="number"
              step="0.1"
              min="0"
              max="1"
              placeholder="0.9"
              data-testid="input-top-p"
            />
          </div>
          <div>
            <Label htmlFor="presence-penalty">Presence Penalty</Label>
            <Input
              {...form.register("presencePenalty", { valueAsNumber: true })}
              id="presence-penalty"
              type="number"
              step="0.1"
              min="-2"
              max="2"
              placeholder="0"
              data-testid="input-presence-penalty"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}