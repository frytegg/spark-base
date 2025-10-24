export async function tryBatch(calls: { to: `0x${string}`; data: `0x${string}`; value?: `0x${string}` }[]) {
  const eth = (window as any).ethereum;
  if (!eth?.request) return { ok: false as const };
  try {
    const txHash = await eth.request({
      method: "wallet_sendCalls",
      params: [{ calls, capabilities: {} }]
    });
    return { ok: true as const, txHash };
  } catch {
    return { ok: false as const };
  }
}
