import { useAuth0 } from "@auth0/auth0-react";

export function useAuth() {
  const { user, isLoading, isAuthenticated, loginWithRedirect, logout, getAccessTokenSilently } = useAuth0();

  return {
    user,
    isLoading,
    isAuthenticated,
    login: loginWithRedirect,
    logout: () => logout({ logoutParams: { returnTo: window.location.origin } }),
    getAccessToken: getAccessTokenSilently,
  };
}
