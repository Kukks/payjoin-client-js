import {
  PayjoinClient,
  IPayjoinClientWallet,
  IPayjoinRequester,
} from '../ts_src/index';
import * as bitcoin from 'bitcoinjs-lib';
import { default as VECTORS } from './fixtures/client.fixtures';

// pass the regtest network to everything
const network = bitcoin.networks.regtest;

describe('requestPayjoin', () => {
  it('should exist', () => {
    expect(PayjoinClient).toBeDefined();
    expect(typeof PayjoinClient).toBe('function'); // JS classes are functions
  });
  VECTORS.valid.forEach((f) => {
    it('should request p2sh-p2wpkh payjoin', async () => {
      await testPayjoin(f.p2shp2wpkh);
    });
    it('should request p2wpkh payjoin', async () => {
      await testPayjoin(f.p2wpkh);
    });
  });
  VECTORS.invalid.forEach((f) => {
    it(f.description, async () => {
      await expect(testPayjoin(f.vector)).rejects.toThrowError(
        new RegExp(f.exception),
      );
    });
  });
});

async function testPayjoin(vector: any): Promise<void> {
  const rootNode = bitcoin.bip32.fromBase58(VECTORS.privateRoot, network);
  const wallet = new TestWallet(vector.wallet, rootNode);
  const payjoinRequester = new DummyRequester(vector.payjoin);
  const client = new PayjoinClient({
    wallet,
    payjoinRequester,
  });

  await client.run();

  expect(wallet.tx).toBeDefined();
  expect(wallet.tx!.toHex()).toEqual(vector.finaltx);
}

// Use this for testing
class TestWallet implements IPayjoinClientWallet {
  tx: bitcoin.Transaction | undefined;
  timeout: NodeJS.Timeout | undefined;

  constructor(
    private psbtString: string,
    private rootNode: bitcoin.BIP32Interface,
  ) {}

  async getPsbt() {
    return bitcoin.Psbt.fromBase64(this.psbtString, { network });
  }

  async signPsbt(psbt: bitcoin.Psbt): Promise<bitcoin.Psbt> {
    psbt.data.inputs.forEach((psbtInput, i) => {
      if (
        psbtInput.finalScriptSig === undefined &&
        psbtInput.finalScriptWitness === undefined
      ) {
        psbt.signInputHD(i, this.rootNode).finalizeInput(i);
      }
    });
    return psbt;
  }

  async broadcastTx(txHex: string): Promise<string> {
    this.tx = bitcoin.Transaction.fromHex(txHex);
    return '';
  }

  async scheduleBroadcastTx(txHex: string, ms: number): Promise<void> {
    return txHex + ms + 'x' ? undefined : undefined;
  }

  async getSumPaidToUs(psbt: bitcoin.Psbt): Promise<number> {
    let ourTotalIn = 0;
    let ourTotalOut = 0;
    for (let i = 0; i < psbt.inputCount; i++) {
      if (psbt.inputHasHDKey(i, this.rootNode))
        ourTotalOut += psbt.data.inputs[i].witnessUtxo!.value;
    }

    for (let i = 0; i < psbt.data.outputs.length; i++) {
      if (psbt.outputHasHDKey(i, this.rootNode))
        ourTotalIn += psbt.txOutputs[i].value;
    }

    return ourTotalIn - ourTotalOut;
  }
}

class DummyRequester implements IPayjoinRequester {
  constructor(private psbt: string) {}

  async requestPayjoin(psbt: bitcoin.Psbt): Promise<bitcoin.Psbt> {
    const myString = psbt ? this.psbt : this.psbt;
    // @ts-ignore
    if (!myString) return;
    return bitcoin.Psbt.fromBase64(myString, { network });
  }
}
