declare function isEthTxMessage(msg: any): boolean;
declare function handleRawTx(txBytes: Buffer): Promise<void>;
declare function processSwapTx(_tx: any): Promise<void>;
export declare function startMempoolMonitoring(): Promise<void>;
export declare function stopMempoolMonitoring(): Promise<void>;
export { handleRawTx, processSwapTx, isEthTxMessage };
