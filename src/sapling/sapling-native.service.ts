import { TezosSaplingTransaction } from '../interfaces/TezosSaplingTransaction'
import { SaplingPartialOutputDescription, SaplingUnsignedSpendDescription } from '@airgap/sapling-wasm'
import { NativeModules } from "react-native"
const { Sapling } = NativeModules;

export interface TezosSaplingExternalMethodProvider {
  initParameters?: (spendParams: Buffer, outputParams: Buffer) => Promise<void>
  withProvingContext?: (
    action: (context: number) => Promise<TezosSaplingTransaction>
  ) => Promise<TezosSaplingTransaction>
  prepareSpendDescription?: (
    context: number,
    spendingKey: Buffer,
    address: Buffer,
    rcm: string,
    ar: Buffer,
    value: string,
    root: string,
    merklePath: string
  ) => Promise<SaplingUnsignedSpendDescription>
  preparePartialOutputDescription?: (
    context: number,
    address: Buffer,
    rcm: Buffer,
    esk: Buffer,
    value: string
  ) => Promise<SaplingPartialOutputDescription>
  createBindingSignature?: (
    context: number,
    balance: string,
    sighash: Buffer
  ) => Promise<Buffer>
}

export class SaplingNativeService {
  constructor() {

  }

  public async createExternalMethodProvider(): Promise<TezosSaplingExternalMethodProvider | undefined> {
    console.log("Sapling native service")
    console.log(await Sapling.getPaymentAddress())
    await Sapling.initParameters()
    console.log("Sapling params awaited")
    return {
      initParameters: this.initParameters(),
      withProvingContext: this.withProvingContext(),
      prepareSpendDescription: this.prepareSpendDescription(),
      preparePartialOutputDescription: this.preparePartialOutputDescription(),
      createBindingSignature: this.createBindingSignature()
    }

  }

  private initParameters(): TezosSaplingExternalMethodProvider['initParameters'] {
    return async (_spendParams: Buffer, _outputParams: Buffer): Promise<void> => {
      return Sapling.initParameters()
    }
  }

  private withProvingContext(): TezosSaplingExternalMethodProvider['withProvingContext'] {
    return async (action: (context: number) => Promise<TezosSaplingTransaction>): Promise<TezosSaplingTransaction> => {
      const { context } = await Sapling.initProvingContext()
      const transaction = await action(parseInt(context))
      await Sapling.dropProvingContext({ context })

      return transaction
    }
  }

  private prepareSpendDescription(): TezosSaplingExternalMethodProvider['prepareSpendDescription'] {
    return async (
      context: number,
      spendingKey: Buffer,
      address: Buffer,
      rcm: string,
      ar: Buffer,
      value: string,
      root: string,
      merklePath: string
    ): Promise<SaplingUnsignedSpendDescription> => {
      const { spendDescription: spendDescriptionHex } = await Sapling.prepareSpendDescription({
        context: context.toString(),
        spendingKey: spendingKey.toString('hex'),
        address: address.toString('hex'),
        rcm,
        ar: ar.toString('hex'),
        value,
        root,
        merklePath
      })

      const spendDescription: Buffer = Buffer.from(spendDescriptionHex, 'hex')

      return {
        cv: spendDescription.slice(0, 32) /* 32 bytes */,
        rt: spendDescription.slice(32, 64) /* 32 bytes */,
        nf: spendDescription.slice(64, 96) /* 32 bytes */,
        rk: spendDescription.slice(96, 128) /* 32 bytes */,
        proof: spendDescription.slice(128, 320) /* 48 + 96 + 48 bytes */
      }
    }
  }

  private preparePartialOutputDescription(

  ): TezosSaplingExternalMethodProvider['preparePartialOutputDescription'] {
    return async (context: number, address: Buffer, rcm: Buffer, esk: Buffer, value: string): Promise<SaplingPartialOutputDescription> => {
      const { outputDescription: outputDescriptionHex } = await Sapling.preparePartialOutputDescription({
        context: context.toString(),
        address: address.toString('hex'),
        rcm: rcm.toString('hex'),
        esk: esk.toString('hex'),
        value
      })

      const outputDescription: Buffer = Buffer.from(outputDescriptionHex, 'hex')

      return {
        cv: outputDescription.slice(0, 32) /* 32 bytes */,
        cm: outputDescription.slice(32, 64) /* 32 bytes */,
        proof: outputDescription.slice(64, 256) /* 48 + 96 + 48 bytes */
      }
    }
  }

  private createBindingSignature(): TezosSaplingExternalMethodProvider['createBindingSignature'] {
    return async (context: number, balance: string, sighash: Buffer): Promise<Buffer> => {
      const { bindingSignature } = await Sapling.createBindingSignature({
        context: context.toString(),
        balance,
        sighash: sighash.toString('hex')
      })

      return Buffer.from(bindingSignature, 'hex')
    }
  }
}
