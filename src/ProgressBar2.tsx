import React, { useState } from "react";
import { BlobServiceClient, BlockBlobClient } from "@azure/storage-blob";
import { InboxOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";
import { Progress } from "antd";
import { message, Upload } from "antd";
const blobServiceClient = new BlobServiceClient(
  `https://dieselstoragegen2.blob.core.windows.net/client-data?sp=racwdlmeop&st=2023-03-09T06:39:11Z&se=2023-09-30T15:39:11Z&sv=2021-12-02&sr=c&sig=1%2BFLWUEQEv2EWAGzXS0prHHriAHjjeP6DNAq538zKbk%3D`
);

const UploadForm: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  const [uploadedBytes, setUploadedBytes] = useState<number[]>([]);
  const [fileData, setFileData] = useState<any[]>([]);
  // const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   if (event.target.files && event.target.files.length > 0) {
  //     setSelectedFiles(event.target.files);
  //   }
  // };
  const { Dragger } = Upload;

  const handleUpload = async () => {
    let currentFiles = [];
    if (selectedFiles) {
      const containerName = "client-data";
      for (let i = 0; i < selectedFiles.length; i++) {
        const selectedFile = selectedFiles[i];
        const blobName = selectedFile.name;

        currentFiles[i] = { name: blobName, loadedBytes: [], percentage: 0 };

        const containerClient = blobServiceClient.getContainerClient(
          containerName
        );
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        const fileSize = selectedFile.size;
        const blockSize = 4 * 1024 * 1024; // 4MB
        const numBlocks = Math.ceil(fileSize / blockSize);
        const progressCalculator = (totalBytes: any) => {
          let bytesUploaded = [...totalBytes];
          let bytesUploadedTotal = bytesUploaded
            .map((bytes) => {
              return bytes;
            })
            .reduce((accumlator, currentValue) => {
              return accumlator + currentValue;
            });
          let percentage: number = (bytesUploadedTotal / fileSize) * 100;
          return Math.floor(percentage);
        };
        let blockIds: string[] = [];
        for (let j = 0; j < numBlocks; j++) {
          const start = j * blockSize;
          const end = Math.min(fileSize, start + blockSize);
          const block = selectedFile.originFileObj.slice(start, end);

          const blockId = btoa(j.toString());
          blockIds.push(blockId);

          try {
            await blockBlobClient.stageBlock(blockId, block, end - start, {
              onProgress: (e) => {
                let allbytes = currentFiles[i].loadedBytes;
                allbytes[j] = e.loadedBytes;

                // setUploadedBytes([...allbytes]);
                currentFiles[i].loadedBytes = [...allbytes];
                currentFiles[i].percentage = progressCalculator(allbytes);
                setFileData([...currentFiles]);
                console.log("allBytes", allbytes);
                // console.log("currentfiles", currentFiles);
              }
            });
          } catch (e) {
            console.log(e);
          }
        }
        // console.log("currentFile", currentFiles);
        // await blockBlobClient.commitBlockList(blockIds);
      }
    }
  };
  const props: UploadProps = {
    name: "file",
    multiple: true,
    customRequest: () => handleUpload(),
    onChange(info) {
      setSelectedFiles([...info.fileList]);
    },
    onDrop(e) {
      setSelectedFiles([...e.dataTransfer.files]);
    }
  };
  return (
    <div>
      <Dragger showUploadList={false} {...props}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">
          Click or drag file to this area to upload
        </p>
        <p className="ant-upload-hint">
          Support for a single or bulk upload. Strictly prohibited from
          uploading company data or other banned files.
        </p>
      </Dragger>
      {fileData.length > 0 &&
        fileData.map((file, index) => {
          return (
            <>
              <h3>
                Upload progress-File {index + 1} of {selectedFiles.length}
                <br />
                {file.name}
              </h3>
              <Progress percent={file.percentage} />
            </>
          );
        })}
    </div>
  );
};

export default UploadForm;
