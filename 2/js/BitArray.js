function BitArray(arrayBuffer){
    const self = this;
    self.rawData =  new Uint8Array(arrayBuffer.buffer?arrayBuffer.buffer:arrayBuffer);
    const bitByBlock = 8*self.rawData.BYTES_PER_ELEMENT;
    self.offset=0;

    self.set = (value,bitSize=-1,offset= -1)=>{
        if(bitSize === -1) bitSize = Math.max(1,Math.ceil(Math.log2(value+1)));
        if(offset === -1){
            offset = self.offset;
            self.offset+= bitSize;
        }

        const currentBlock = Math.floor(offset/bitByBlock);
        const availableBits = bitByBlock - offset%bitByBlock;
        if(bitSize<=availableBits){
            // get block;
            const blockOriginalContent = self.rawData[currentBlock];
            let newBlockContent = blockOriginalContent;
            // clean the writing area
            newBlockContent = newBlockContent>>>availableBits;
            newBlockContent = newBlockContent<<availableBits;
            const restoreLastBits = blockOriginalContent%Math.pow(2,availableBits-bitSize);
            newBlockContent = newBlockContent | restoreLastBits;
            // shift value to the good offset
            const readyToInsert = value<<(availableBits-bitSize);
            newBlockContent = newBlockContent | readyToInsert;
            // replace the block content;
            self.rawData[currentBlock] = newBlockContent;
        } else {
            // get block;
            let newBlockContent = self.rawData[currentBlock];
            // clean the writing area
            newBlockContent = newBlockContent>>>availableBits;
            newBlockContent = newBlockContent<<availableBits;
            // shift value to keep the part writable in this block
            const readyToInsert = value>>>bitSize-availableBits;
            newBlockContent = newBlockContent | readyToInsert;
            // replace the block content;
            self.rawData[currentBlock] = newBlockContent;
            // write remaining part
            self.set(value%Math.pow(2,bitSize-availableBits),bitSize-availableBits,offset+availableBits);
        }
        return self;
    };
    self.append = (value,bitSize=-1)=>{
        self.set(value,bitSize);
        return self;
    };
    self.get=(bitSize,offset = -1)=>{
        if(offset === -1){
            offset = self.offset;
            self.offset+= bitSize;
        }
        const currentBlock = Math.floor(offset/bitByBlock);
        const availableBits = bitByBlock - offset%bitByBlock;
        //console.log(`offset:${offset}, ${bitSize}bits -> in block ${currentBlock}, read from bit ${bitByBlock-availableBits} to bit ${bitByBlock-availableBits+bitSize}`);
        if(bitSize<=availableBits){
            // get block;
            let result = self.rawData[currentBlock];
            // floor to availableBits
            result = result%Math.pow(2,availableBits);
            // shift to bitSize
            result = result>>>(availableBits-bitSize);
            return result;
        }else {
            // get block;
            let result = self.rawData[currentBlock];
            // floor to availableBits
            result = result%Math.pow(2,availableBits);

            const remainingBitSize = bitSize - availableBits;
            // shift left up to to remaining bitSize
            result = result<<remainingBitSize;

            const remaining = self.get(remainingBitSize,offset+availableBits);
            return  result+remaining;
        }
    };
    return self;
}