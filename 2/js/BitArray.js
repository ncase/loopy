function BitArray(arrayBufferOrBitSize){
    const self = this;
    if(typeof arrayBufferOrBitSize === "number") self.rawData = new Uint8Array(Math.ceil(arrayBufferOrBitSize/8));
    else self.rawData =  new Uint8Array(arrayBufferOrBitSize.buffer?arrayBufferOrBitSize.buffer:arrayBufferOrBitSize);
    const bitByBlock = 8*self.rawData.BYTES_PER_ELEMENT;
    self.offset=0;
    self.maxOffset=0;

    self.set = (value,bitSize=-1,offset= -1)=>{
        if(bitSize===0) return self;
        if(typeof value !== "number") {
            if(bitSize === -1) bitSize = value.rawData.byteLength*8;
        }
        if(bitSize === -1) bitSize = Math.max(1,Math.ceil(Math.log2(value+1)));
        if(offset === -1){
            offset = self.offset;
            self.setOffset(self.offset+bitSize);
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
            if(typeof value !== "number") value = value.get(bitSize);
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
            let readyToInsert;
            if(typeof value === "number") readyToInsert = value>>>bitSize-availableBits;
            else readyToInsert = value.get(availableBits);
            newBlockContent = newBlockContent | readyToInsert;
            // replace the block content;
            self.rawData[currentBlock] = newBlockContent;
            // write remaining part
            if(typeof value === "number") self.set(value%Math.pow(2,bitSize-availableBits),bitSize-availableBits,offset+availableBits);
            else self.set(value,bitSize-availableBits,offset+availableBits);
        }
        return self;
    };
    self.append = (value,bitSize=-1)=>{
        self.set(value,bitSize);
        return self;
    };
    function shouldBeCompressed(bitSize){
        const bitForDataSize = Math.ceil(Math.log2(bitSize));
        const refBitSize = Math.floor(bitForDataSize/2);
        const zMinSize = 1 // origin line
            +1 // ref line
            +1+bitForDataSize+refBitSize // ref size
        ;//+1+bitForDataSize; // original content in ref line
        return bitSize>=zMinSize*3; // if small bitSize it will be more often bigger than smaller so dont compress
    }
    self.zPush = (value,bitSize,zAreaStartOffset=0)=>{
        if(!shouldBeCompressed(bitSize)) return self.append(value,bitSize);
        if(zAreaStartOffset===self.offset) return self.append(value,bitSize);
        if(typeof value !== "object") value = (new BitArray(bitSize)).append(value,bitSize).resetOffset();

        fillZCache(bitSize,zAreaStartOffset);

        const bitForDataSize = Math.ceil(Math.log2(bitSize));
        const refBitSize = Math.floor(bitForDataSize/2);
        const minFragmentSize = 1+bitForDataSize+refBitSize+1+bitForDataSize;

        const zc = zCache[zAreaStartOffset];
        const maxPrevious = Math.min(zc.length,Math.pow(2,refBitSize));

        const pushCandidates = [];
        let partialCandidate = new BitArray(bitSize+1);
        let srcOffsetPartial = 0;

        finish: for (let offset=0;offset<bitSize-minFragmentSize;offset++){
            outLoop: for(let patternSize=bitSize-offset;patternSize>minFragmentSize;patternSize--){
                for(let i = 0;i<maxPrevious;i++){
                    if(value.equalSequence(patternSize,offset,zc[zc.length-(1+i)].content,offset)){
                        const candidate =new BitArray(bitSize+1);
                        if(srcOffsetPartial===0) candidate.append(1,1);// this line contain references
                        candidate.append(partialCandidate.resetOffset(),partialCandidate.maxOffset);
                        if(offset-srcOffsetPartial){
                            candidate.append(0,1);// unique data area
                            candidate.append(offset-srcOffsetPartial,bitForDataSize); // for this number of bits
                            candidate.append(value.setOffset(srcOffsetPartial),offset-srcOffsetPartial);
                        }
                        candidate.append(1,1);// ref data area
                        candidate.append(patternSize,bitForDataSize); // referred data size
                        candidate.append(i,refBitSize);
                        if(offset+patternSize<bitSize){
                            srcOffsetPartial = offset+patternSize;
                            partialCandidate = new BitArray(bitSize+1);
                            partialCandidate.append(candidate.resetOffset(),candidate.maxOffset);
                            candidate.append(0,1);// unique data area
                            candidate.append(bitSize-(offset+patternSize),bitForDataSize); // for this number of bits
                            candidate.append(value.export(bitSize-(offset+patternSize),offset+patternSize).resetOffset(),bitSize-(offset+patternSize));
                            pushCandidates.push(candidate);
                            offset=srcOffsetPartial;
                            break outLoop;
                        } else {
                            pushCandidates.push(candidate);
                            break finish;
                        }
                    }
                }
            }
        }
        const smallest = pushCandidates.reduce((a,c)=>a.offset<=c.offset?a:c,
            (new BitArray(bitSize+1)).append(0,1).append(value.resetOffset(),bitSize));// default vanilla line
        return self.append(smallest.resetOffset(),smallest.maxOffset);
    };
    self.resetOffset = ()=>self.setOffset(0);
    self.setOffset = (offset)=>{
        self.maxOffset = Math.max(self.maxOffset,self.offset,offset);
        self.offset = offset;
        return self;
    };
    self.equalSequence = (bitSize, selfStartOffset, bitArray,itStartOffset)=>{
        const a = self.export(bitSize,selfStartOffset);
        const b = bitArray.export(bitSize,itStartOffset);
        let equal = true;
        for(let i =0; i<a.rawData.byteLength;i++) if(a.rawData[i]!==b.rawData[i]) equal=false;
        return equal;
    };
    self.concat = (bitArray)=>{
        const concatenated = new BitArray(self.offset+bitArray.offset);
        const backupSelfOffset = self.offset;
        const backupBitArrayOffset = bitArray.offset;
        self.resetOffset();
        bitArray.resetOffset();
        concatenated.append(self,backupSelfOffset);
        concatenated.append(bitArray,backupBitArrayOffset);
        self.setOffset(backupSelfOffset);
        bitArray.setOffset(backupBitArrayOffset);
        return concatenated;
    };
    const zCache = [];
    function fillZCache(bitSize,zAreaStartOffset,cacheToLine=false){
        const bitForDataSize = Math.ceil(Math.log2(bitSize));
        const refBitSize = Math.floor(bitForDataSize/2);

        if(!zCache[zAreaStartOffset]) zCache[zAreaStartOffset] = [];
        const zc = zCache[zAreaStartOffset];
        if(!zc[0])zc[0]={offset:zAreaStartOffset,zSize:bitSize,content:self.export(bitSize,zAreaStartOffset)};
        let cacheOffset = zc[zc.length-1].offset+zc[zc.length-1].zSize;
        for(let i = zc.length;true;i++){
            if(cacheToLine===false && cacheOffset>=self.offset) break;
            if(cacheToLine===true && cacheOffset>=self.offset+1) {
                self.setOffset(cacheOffset) ;
                break;
            }
            if(typeof cacheToLine === "number" && cacheToLine<zc.length) break;

            const lineOffset = cacheOffset;
            let zSize = 0;
            const lineType = self.get(1,lineOffset+zSize); zSize+=1;
            if(lineType===0) zc[i] = {offset:lineOffset,zSize:zSize+bitSize,content:self.export(bitSize,lineOffset+zSize)};
            else {
                let bitFound = 0;
                let content=new BitArray(1);
                while (bitFound<bitSize){
                    const blockType = self.get(1,lineOffset+zSize); zSize+=1;
                    if(blockType===0){ // new datas
                        const howMuchDataToRead = self.get(bitForDataSize,lineOffset+zSize); zSize+=bitForDataSize;
                        const data = self.export(howMuchDataToRead,lineOffset+zSize); zSize+=howMuchDataToRead;
                        content = content.concat(data);
                        bitFound+=howMuchDataToRead;
                    } else { // ref to previous data
                        const howMuchDataToRead = self.get(bitForDataSize,lineOffset+zSize); zSize+=bitForDataSize;
                        const howManyLineBeforeLastOne = self.get(refBitSize,lineOffset+zSize); zSize+=refBitSize;
                        const data = zc[i-(1+howManyLineBeforeLastOne)].content.export(howMuchDataToRead,bitFound);
                        content = content.concat(data);
                        bitFound+=howMuchDataToRead;
                    }
                }
                zc[i] = {offset:lineOffset,zSize:zSize,content:content};
            }
            cacheOffset+=zc[i].zSize;
        }
    }
    self.zGet = (bitSize,zAreaStartOffset=0,zLine= NaN)=>{
        if(!shouldBeCompressed(bitSize)){
            if(isFinite(zLine) && zLine>=0) return self.get(bitSize,zAreaStartOffset+zLine*bitSize);
            else if(isFinite(zLine) && zLine<0) return self.get(bitSize,self.offset-zLine*bitSize);
            else return self.get(bitSize);
        }
        if(isNaN(zLine)) fillZCache(bitSize,zAreaStartOffset,true);
        else if(isFinite(zLine) && zLine>0) fillZCache(bitSize,zAreaStartOffset,zLine);
        else fillZCache(bitSize,zAreaStartOffset);

        const zc = zCache[zAreaStartOffset];
        if(isFinite(zLine) && zLine>=0) return zc[zLine].content;
        else if(isFinite(zLine) && zLine<0) return zc[zc.length+zLine].content;
        else return zc[zc.length-1].content;
    };
    self.get=(bitSize,offset = -1)=>{
        if(offset === -1){
            offset = self.offset;
            self.setOffset(self.offset+bitSize);
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
    self.export=(bitSize,offset = -1)=>{
        if(offset === -1){
            offset = self.offset;
            self.setOffset(self.offset+bitSize);
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
            const bitArrayResult = new BitArray(bitSize);
            bitArrayResult.append(result,bitSize);
            return bitArrayResult;
        }else {
            // get block;
            let result = self.rawData[currentBlock];
            // floor to availableBits
            result = result % Math.pow(2, availableBits);

            const bitArrayResult = new BitArray(bitSize);
            bitArrayResult.append(result,availableBits);

            const remainingBitSize = bitSize - availableBits;
            const remaining = self.export(remainingBitSize, offset + availableBits);
            bitArrayResult.append(remaining.resetOffset(),remainingBitSize);

            return bitArrayResult;
        }

    };
    self.rotate = (bitByLine, lineCount, startOffset= -1)=>{
        if( !bitByLine || !lineCount) return self;
        if(startOffset === -1){
            startOffset = self.offset;
            self.setOffset(self.offset+bitByLine*lineCount);
        }
        const workSpace = new BitArray(bitByLine*lineCount);
        for(let b=0 ; b<bitByLine;b++){
            for (let l=0;l<lineCount;l++){
                workSpace.append(self.get(1,startOffset+l*bitByLine+b),1);
            }
        }
        self.set(workSpace.resetOffset(),bitByLine*lineCount,startOffset);
        return self;
    }
    return self;
}