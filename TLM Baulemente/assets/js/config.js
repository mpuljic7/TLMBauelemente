/* Public settings only. Never put passwords or private API keys here. */
window.TLM_CONFIG = Object.freeze({
  // HTTPS endpoint accepting JSON. Required response: HTTP 2xx + { "success": true }.
  formEndpoint: "",
  // Only enable categories after the owner confirms them. IDs:
  // doors, sliding, shutters, shading, installation, renovation
  confirmedServices: []
});
