export type ProxyType = 'tcp' | 'udp' | 'http' | 'https' | 'tcpmux' | 'stcp' | 'sudp' | 'xtcp';

export interface BaseProxyConfig {
  name: string;
  type: ProxyType;
  localIP?: string;
  localPort: number;
  useEncryption?: boolean;
  useCompression?: boolean;
  bandwidthLimit?: string;
  bandwidthLimitMode?: 'client' | 'server';
  proxyProtocolVersion?: 'v1' | 'v2';
}

export interface TCPProxyConfig extends BaseProxyConfig {
  type: 'tcp';
  remotePort: number;
}

export interface UDPProxyConfig extends BaseProxyConfig {
  type: 'udp';
  remotePort: number;
}

export interface HTTPProxyConfig extends BaseProxyConfig {
  type: 'http';
  customDomains?: string[];
  subdomain?: string;
  locations?: string[];
  httpUser?: string;
  httpPassword?: string;
  hostHeaderRewrite?: string;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  routeByHTTPUser?: string;
}

export interface HTTPSProxyConfig extends BaseProxyConfig {
  type: 'https';
  customDomains?: string[];
  subdomain?: string;
}

export interface TCPMuxProxyConfig extends BaseProxyConfig {
  type: 'tcpmux';
  customDomains?: string[];
  subdomain?: string;
  httpUser?: string;
  httpPassword?: string;
  routeByHTTPUser?: string;
  multiplexer?: string;
}

export interface STCPProxyConfig extends BaseProxyConfig {
  type: 'stcp';
  secretKey?: string;
  allowUsers?: string[];
}

export interface XTCPProxyConfig extends BaseProxyConfig {
  type: 'xtcp';
  secretKey?: string;
  allowUsers?: string[];
}

export interface SUDPProxyConfig extends BaseProxyConfig {
  type: 'sudp';
  secretKey?: string;
  allowUsers?: string[];
}

export type ProxyConfig = 
  | TCPProxyConfig 
  | UDPProxyConfig 
  | HTTPProxyConfig 
  | HTTPSProxyConfig 
  | TCPMuxProxyConfig 
  | STCPProxyConfig 
  | XTCPProxyConfig 
  | SUDPProxyConfig; 