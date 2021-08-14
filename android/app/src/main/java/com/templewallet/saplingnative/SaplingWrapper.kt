package com.templewallet.saplingnative

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import it.airgap.sapling.Sapling
import android.util.Log;

// fun readFromAssets(path: String) {
    //    bridge.activity.assets.open
// }(path).use { it.readBytes() }

fun ByteArray.asHexString(): String = joinToString(separator = "") { "%02x".format(it) }

fun String.isHex(): Boolean = matches(Regex("^(0x)?([0-9a-fA-F]{2})+$"))

fun String.asByteArray(): ByteArray =
        if (isHex()) chunked(2).map { it.toInt(16).toByte() }.toByteArray() else toByteArray()

private val JULIAN_VIEWING_KEY =
        "0000000000000000004e836dac37234f08916ee886c8a6834816a0520b3d666bd4edf42130f826cae2379a26861252d22605e041b3ec6e19449a23863bce9ff20b78615a58446f7106f31f7a3d0efed751de9585116f73dbab76955d9b4d4378ed256792d57dce70e3cbbfaef401b0736255d060619f357c81c17074e1007d448bae942a19d33836da047bf52a95387da1b811a35b89eb3c8f46089208d5785445c01d382b9a153df9"

class SaplingWrapper internal constructor(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
    private val sapling: Sapling by lazy { Sapling() }
    private val context = context

   @ReactMethod
   fun initParameters(promise: Promise) {
    //    val spendParameters = readFromAssets("public/assets/sapling/sapling-spend.params")
    //    val outputParameters = readFromAssets("public/assets/sapling/sapling-output.params")
    val assets = context.getAssets()
    val spendParamsStream = assets.open("sapling-params/sapling-spend.params")
    val outputParamsStream = assets.open("sapling-params/sapling-output.params")

    val spendParamsBytes = spendParamsStream.readBytes()
    val outputParamsBytes = outputParamsStream.readBytes()

    // val saplingAssetsList = assets.list("sapling-params")
    // var stringList = java.lang.String.join("", saplingAssetsList)
    // val text = saplingAssetsList!!.joinToString("\n")
    Log.d("spend param byte length", spendParamsBytes.size.toString())
    Log.d("output param byte length", outputParamsBytes.size.toString())

    sapling.initParameters(spendParamsBytes, outputParamsBytes)

    promise.resolve(true)
   }

    override fun getName(): String {
        return "Sapling"
    }


    @ReactMethod
    fun getPaymentAddress(promise: Promise) {
        Log.d("julik view key", JULIAN_VIEWING_KEY.asByteArray().asHexString())
        val address = sapling.getIncomingViewingKey(JULIAN_VIEWING_KEY.asByteArray())
        promise.resolve(address.asHexString())
    }

    @ReactMethod
    fun initProvingContext(promise: Promise) {
        promise.resolve(sapling.initProvingContext().toString())
    }

    @ReactMethod
    fun dropProvingContext(context: Long, promise: Promise) {
        val res = sapling.dropProvingContext(context)
        promise.resolve(res)
    }

    @ReactMethod
    fun createBindingSignature(context: Long, balance: Long, sighash: ByteArray, promise: Promise) {
        val bindingSignature = sapling.createBindingSignature(context, balance, sighash)

        promise.resolve(bindingSignature.asHexString())
    }

    @ReactMethod
    fun prepareSpendDescription(context: Long,
                                spendingKey: ByteArray,
                                address: ByteArray,
                                rcm: ByteArray,
                                ar: ByteArray,
                                value: Long,
                                root: ByteArray,
                                merklePath: ByteArray,
                                promise: Promise) {
        val spendDescription = sapling.prepareSpendDescription(
                context,
                spendingKey,
                address,
                rcm,
                ar,
                value,
                root,
                merklePath
        )

        promise.resolve(spendDescription.asHexString())
    }

    @ReactMethod
    fun preparePartialOutputDescription(context: Long,
                                        address: ByteArray,
                                        rcm: ByteArray,
                                        esk: ByteArray,
                                        value: Long,
                                        promise: Promise) {
        val outputDescription = sapling.preparePartialOutputDescription(
                context,
                address,
                rcm,
                esk,
                value
        )

        promise.resolve(outputDescription.asHexString())
    }

    /******** Commitment ********/

    @ReactMethod
    public fun verifyCommitment(commitment: ByteArray, address: ByteArray, value: Long, rcm: ByteArray, promise: Promise) {
        
        val cmu = sapling.verifyCommitment(commitment, address, value, rcm)
        promise.resolve(cmu)
    }

    @ReactMethod
    public fun keyAgreement(p: ByteArray, sk: ByteArray, promise: Promise) {
       promise.resolve(sapling.keyAgreement(p, sk))
    }


    /******** Merkle Tree ********/

    @ReactMethod
    public fun merkleHash(depth: Long, lhs: ByteArray, rhs: ByteArray, promise: Promise) {
       promise.resolve(sapling.merkleHash(depth, lhs, rhs))
    }

    /******** Nullifier ********/

    @ReactMethod
    public fun computeNullifier(viewingKey: ByteArray, address: ByteArray, value: Long, rcm: ByteArray, position: Long, promise: Promise) {
       promise.resolve(sapling.computeNullifier(viewingKey, address, value, rcm, position))
    }

    /******** Output Description ********/

    @ReactMethod
    public fun prepareOutputDescription(context: Long, viewingKey: ByteArray, address: ByteArray, rcm: ByteArray, value: Long, promise: Promise) {
       promise.resolve(sapling.prepareOutputDescription(context, viewingKey, address, rcm, value))
    }

    /******** Payment Address ********/

    @ReactMethod
    public fun getPaymentAddressFromViewingKey(viewingKey: ByteArray, index: ByteArray?, promise: Promise) {
        promise.resolve(sapling.getPaymentAddressFromViewingKey(viewingKey, index))
    }

    @ReactMethod
    public fun getNextPaymentAddressFromViewingKey(viewingKey: ByteArray, index: ByteArray, promise: Promise) {
       promise.resolve(sapling.getNextPaymentAddressFromViewingKey(viewingKey, index))
    }

    @ReactMethod
    public fun getRawPaymentAddressFromIncomingViewingKey(viewingKey: ByteArray, diversifier: ByteArray, promise: Promise) {
       promise.resolve(sapling.getRawPaymentAddressFromIncomingViewingKey(viewingKey, diversifier))
    }

    @ReactMethod
    public fun getDiversifierFromRawPaymentAddress(address: ByteArray, promise: Promise) {
       promise.resolve(sapling.getDiversifierFromRawPaymentAddress(address))
    }

    @ReactMethod
    public fun getPkdFromRawPaymentAddress(address: ByteArray, promise: Promise) {
       promise.resolve(sapling.getPkdFromRawPaymentAddress(address))
    }

    /******** Rand ********/

    @ReactMethod
    public fun randR(promise: Promise) {
        promise.resolve(sapling.randR())
    }
    /******** Spend Description ********/

    @ReactMethod
    public fun signSpendDescription(spendDescription: ByteArray, spendingKey: ByteArray, ar: ByteArray, sighash: ByteArray, promise: Promise) {
       promise.resolve(sapling.signSpendDescription(spendDescription, spendingKey, ar, sighash))
    }

    /******** Spending Key ********/

    @ReactMethod
    public fun getExtendedSpendingKey(seed: ByteArray, derivationPath: String, promise: Promise) {
       promise.resolve(sapling.getExtendedSpendingKey(seed, derivationPath))
    }

    @ReactMethod
    public fun getExtendedFullViewingKey(seed: ByteArray, derivationPath: String, promise: Promise) {
       promise.resolve(sapling.getExtendedFullViewingKey(seed, derivationPath))
    }

    @ReactMethod
    public fun getExtendedFullViewingKeyFromSpendingKey(spendingKey: ByteArray, promise: Promise) {
       promise.resolve(sapling.getExtendedFullViewingKeyFromSpendingKey(spendingKey))
    }

    @ReactMethod
    public fun getOutgoingViewingKey(viewingKey: ByteArray, promise: Promise) {
       promise.resolve(sapling.getOutgoingViewingKey(viewingKey))
    }

    @ReactMethod
    public fun getIncomingViewingKey(viewingKey: ByteArray, promise: Promise) {
       promise.resolve(sapling.getIncomingViewingKey(viewingKey))
    }

}