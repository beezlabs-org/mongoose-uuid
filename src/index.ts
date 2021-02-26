import { SchemaType, SchemaTypes, Types } from 'mongoose'
import { parse } from 'uuid'
import { Binary } from 'bson'

class UUID extends SchemaTypes.Buffer {
    constructor(key, options) {
        super(key, options, 'UUID')
        UUID.schemaName = 'UUID'
    }

    // `cast()` takes a parameter that can be anything. You need to
    // validate the provided `val` and throw a `CastError` if you
    // can't convert it.
    cast(value): any {
        if (value instanceof Binary) return value

        if (typeof value === 'string') {
            const uuidBuffer = new Types.Buffer(parse(value) as Uint8Array)

            uuidBuffer.subtype(Binary.SUBTYPE_UUID)

            return uuidBuffer
        }

        throw new Error('Could not cast ' + value + ' to UUID.')
    }

    castForQuery($conditional, val) {
        let handler

        if (arguments.length === 2) {
            handler = (this as any).$conditionalHandlers[$conditional]

            if (!handler) {
                throw new Error("Can't use " + $conditional + ' with UUID.')
            }

            return handler.call(this, val)
        }

        return this.cast($conditional)
    }

    get(binary) {
        if (binary == null) return undefined
        if (!(binary instanceof Binary)) return binary

        const len = binary.length()
        const b = binary.read(0, len)
        const buf = new Buffer(len)
        let hex = ''

        for (let i = 0; i < len; i++) {
            buf[i] = b[i]
        }

        for (let i = 0; i < len; i++) {
            const n = buf.readUInt8(i)

            if (n < 16) {
                hex += '0' + n.toString(16)
            } else {
                hex += n.toString(16)
            }
        }

        return (
            hex.substr(0, 8) +
            '-' +
            hex.substr(8, 4) +
            '-' +
            hex.substr(12, 4) +
            '-' +
            hex.substr(16, 4) +
            '-' +
            hex.substr(20, 12)
        )
    }
}

declare module 'mongoose' {
    namespace Schema {
        namespace Types {
            class UUID extends SchemaType {
            }
        }
    }
}


export default function uuid(mongoose) {
    mongoose.Schema.Types.UUID = UUID
}
