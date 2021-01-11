import { Bcrypt } from './util/Bcrypt'
import { ec as EC } from 'elliptic'

const ec = new EC('secp256k1')

export class Transaction {
  public fromAddress: string
  public toAddress: string
  public amount: number
  private signature: string

  /**
   * @param fromAddress
   * @param toAddress
   * @param amount
   */
  constructor (fromAddress: string, toAddress: string, amount: number) {
    this.fromAddress = fromAddress
    this.toAddress = toAddress
    this.amount = amount
  }

  /**
   * Creates a SHA256 hash of the transaction
   *
   * @returns {string}
   */
  calculateHash ():string {
    return Bcrypt.SHA256(this.fromAddress + this.toAddress + this.amount).toString()
  }

  /**
   * Signs a transaction with the given signingKey (which is an Elliptic keypair
   * object that contains a private key). The signature is then stored inside the
   * transaction object and later stored on the blockchain.
   *
   * @param {string} signingKey
   */
  signTransaction (signingKey: any) {
    // You can only send a transaction from the wallet that is linked to your
    // key. So here we check if the fromAddress matches your publicKey
    if (signingKey.getPublic('hex') !== this.fromAddress) {
      throw new Error('You cannot sign transactions for other wallets!')
    }
    // Calculate the hash of this transaction, sign it with the key
    // and store it inside the transaction obect
    const hashTx = this.calculateHash()
    const sig = signingKey.sign(hashTx, 'base64')
    this.signature = sig.toDER('hex')
  }

  /**
   * 重点:验证交易签名是否有效（交易签名是否被篡改）
   * 使用 fromAddress 作为公钥验证
   * @returns {boolean}
   */
  isValid (): boolean {
    if (this.fromAddress === null) {
      return true
    }
    if (!this.signature || this.signature.length === 0) {
      throw new Error('No signature in this transaction')
    }
    const publicKey = ec.keyFromPublic(this.fromAddress, 'hex')
    return publicKey.verify(this.calculateHash(), this.signature)
  }
}
