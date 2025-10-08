# Ethereum devp2p Mempool Monitoring

Một ứng dụng Node.js/TypeScript để lắng nghe mempool Ethereum thông qua devp2p protocol và phát hiện các giao dịch Uniswap.

## Tính năng

- 🔍 **Peer Discovery**: Sử dụng DPT (Discovery Protocol Table) để tìm và kết nối với các peer Ethereum
- 📡 **RLPx Connections**: Thiết lập kết nối RLPx để lắng nghe tin nhắn từ các peer
- 🎯 **Transaction Monitoring**: Phát hiện và xử lý các giao dịch Uniswap trong mempool
- ⚡ **Queue Processing**: Sử dụng p-queue để xử lý giao dịch một cách hiệu quả
- 🛡️ **Error Handling**: Xử lý lỗi graceful và shutdown an toàn

## Cài đặt

```bash
npm install
```

## Sử dụng

### Chạy demo (có console output)

```bash
npm run build
node lib/demo.js
```

### Sử dụng trong code

```typescript
import { startMempoolMonitoring, stopMempoolMonitoring } from './lib/index';

// Bắt đầu monitoring
await startMempoolMonitoring();

// Dừng monitoring
await stopMempoolMonitoring();
```

## Cấu hình

### Uniswap Router
Mặc định monitoring router: `0x66a9893cC07D91D95644AEDD05D03f95e1dBA8Af`

### Swap Selectors
Các function selector được monitoring:
- `0x7ff36ab5` - swapExactETHForTokens
- `0x18cbafe5` - swapExactTokensForETH  
- `0x5c11d795` - swapExactTokensForTokensSupportingFeeOnTransferTokens

### Network Settings
- **Port**: 30303 (Ethereum default)
- **Max Peers**: 120
- **Protocol Versions**: ETH 66, 67, 68

## Kiến trúc

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   DPT Discovery │───▶│   RLPx Layer    │───▶│  Message Handler│
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Find Peers     │    │  Connect Peers  │    │ Process TXs     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │  Worker Queue   │
                                              └─────────────────┘
```

## API

### `startMempoolMonitoring()`
Khởi động mempool monitoring:
- Khởi tạo DPT và RLPx
- Bắt đầu peer discovery
- Lắng nghe kết nối peer

### `stopMempoolMonitoring()`
Dừng monitoring và cleanup resources

### `handleRawTx(txBytes: Buffer)`
Xử lý raw transaction bytes:
- Parse transaction với ethers.js
- Kiểm tra target router
- Kiểm tra function selector
- Thêm vào worker queue

### `processSwapTx(tx: any)`
Xử lý swap transaction:
- Decode swap parameters
- Simulate transaction (có thể thêm)
- Build competing transaction (có thể thêm)

## Lưu ý

⚠️ **Đây là phiên bản demo/simplified**:
- Chưa có peer discovery thực tế (cần bootstrap peers)
- Chưa có message parsing đầy đủ
- Cần cấu hình thêm cho production

🔧 **Để sử dụng production**:
1. Thêm bootstrap peers thực tế
2. Implement đầy đủ ETH protocol message parsing
3. Thêm error handling và logging
4. Cấu hình network settings phù hợp

## Dependencies

- `@ethereumjs/devp2p` - Ethereum devp2p implementation
- `ethers` - Ethereum library
- `p-queue` - Promise queue
- `rlp` - RLP encoding/decoding

## License

MIT# devp2p
