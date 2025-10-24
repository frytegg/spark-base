## Foundry

**Foundry is a blazing fast, portable and modular toolkit for Ethereum application development written in Rust.**

Foundry consists of:

- **Forge**: Ethereum testing framework (like Truffle, Hardhat and DappTools).
- **Cast**: Swiss army knife for interacting with EVM smart contracts, sending transactions and getting chain data.
- **Anvil**: Local Ethereum node, akin to Ganache, Hardhat Network.
- **Chisel**: Fast, utilitarian, and verbose solidity REPL.

## Documentation

https://book.getfoundry.sh/

## Usage

### Build

```shell
$ forge build
```

### Test

```shell
$ forge test
```

### Format

```shell
$ forge fmt
```

### Gas Snapshots

```shell
$ forge snapshot
```

### Anvil

```shell
$ anvil
```

### Deploy

```shell
$ forge script script/Counter.s.sol:CounterScript --rpc-url <your_rpc_url> --private-key <your_private_key>
```

## NFT Badges setup (real metadata/images)

This repo includes an ERC-721 `BadgeNFT` contract that mints one badge per tier per player. We serve tier-based metadata via `tokenURI`, so you only need 4 JSON files (bronze/silver/gold/diamond) on IPFS.

1) Prepare metadata (already provided):

- `packages/contracts/metadata/badges/bronze.json`
- `packages/contracts/metadata/badges/silver.json`
- `packages/contracts/metadata/badges/gold.json`
- `packages/contracts/metadata/badges/diamond.json`

Each JSON contains an embedded data-URI SVG image that matches the in-app mock badge visuals.

2) Upload to NFT.Storage:

- Upload the 4 JSON files as a directory.
- Copy the resulting IPFS CID, e.g. `bafy...`.

3) Set base URI:

- In `packages/contracts/.env`, set:

```
BADGE_BASE_URI=ipfs://<YOUR_CID>/
```

4) Deploy or update base URI:

- Fresh deploy: run the Deploy script; it reads `BADGE_BASE_URI` from .env and configures BadgeNFT.
- Or, update an existing deployment by calling `setBaseURI("ipfs://<YOUR_CID>/")` as the admin.

5) Backend minter role:

- The backend address that calls `mintBadge` must have `MINTER_ROLE`. If it differs from the deployer, grant role:

```
badge.grantRole(MINTER_ROLE, <BACKEND_SIGNER>)
```

6) Tiers mapping in tokenURI:

- The contract maps the low 8 bits of `tokenId` to a tier index:
	- 0 = bronze.json
	- 1 = silver.json
	- 2 = gold.json
	- 3 = diamond.json

That’s it—marketplaces will show your badge images from the uploaded metadata.

### Cast

```shell
$ cast <subcommand>
```

### Help

```shell
$ forge --help
$ anvil --help
$ cast --help
```
