interface Window {
  electronAPI: {
    // ... existing definitions ...
    
    checkFrpVersion: () => Promise<{
      hasVersion: boolean;
      version: string | null;
      hasFrps: boolean;
      hasFrpc: boolean;
    }>;
  };
} 