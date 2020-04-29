/// <reference types="node" />
import { Psbt } from 'bitcoinjs-lib';
import { Bip32Derivation, PsbtInput } from 'bip174/src/lib/interfaces';
export declare enum ScriptPubKeyType {
    Unsupported = 0,
    Legacy = 1,
    Segwit = 2,
    SegwitP2SH = 3
}
export declare const SUPPORTED_WALLET_FORMATS: ScriptPubKeyType[];
export declare function getFee(feeRate: number, size: number): number;
export declare function checkSanity(psbt: Psbt): string[][];
export declare function getInputsScriptPubKeyType(psbt: Psbt): ScriptPubKeyType;
export declare function hasKeypathInformationSet(items: {
    bip32Derivation?: Bip32Derivation[];
}[]): boolean;
export declare function isFinalized(input: PsbtInput): boolean;
export declare function getInputIndex(psbt: Psbt, prevOutHash: Buffer, prevOutIndex: number): number;
