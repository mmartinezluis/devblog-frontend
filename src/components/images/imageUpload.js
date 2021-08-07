import React, {useState} from 'react';
import {uploadFile} from 'react-aws-s3'
import Button from '@material-ui/core/Button';
import axios from 'acios'

const config = {
    bucketName: process.env.REACT_APP_S3_BUCKET,
  //  dirName: 'Enter Folder Name ', /* optional */
    region: process.env.REACT_APP_REGION,
    accessKeyId: process.env.REACT_APP_ACCESS_KEY_ID,
    secretAccessKey: process.env.REACT_APP_SECRET_ACCESS_KEY
}

export function FileUploadPage2() {
	const [selectedFile, setSelectedFile] = useState();
	const [isFilePicked, setIsFilePicked] = useState(false);
	const changeHandler = (event) => {
        // if (event.target.files && event.target.files[0])
		setSelectedFile(event.target.files[0]);
		setIsFilePicked(true);
	};
	const handleSubmission = () => {
		const formData = new FormData();
		formData.append('File', selectedFile);
        const uploadImage = (endpoint, imageData) => {
            axios.post('https://freeimage.host/api/1/upload?key=<YOUR_API_KEY>', {method: 'POST', body: formData} )
            .then((response) => response.json())
            .then((result) => {
                console.log('Success:', result);
            })
            .catch((error) => {
                console.error('Error:', error);
            });
        }
	};
	return(
        <div>
            <label htmlFor="btn-upload">
                <input 
                    style={{ display: 'none' }}
                    id="btn-upload"
                    type="file" 
                    name="btn-upload" 
                    onChange={changeHandler} 
                    accept="image/*"
                />
                 <Button color="secondary" variant="contained" component="span">
                    Upload a cover image
                 </Button>
            </label>
			{isFilePicked ? (
				<div>
					<p>Filename: {selectedFile.name}</p>
					<p>Filetype: {selectedFile.type}</p>
					<p>Size in bytes: {selectedFile.size}</p>
					<p>
						lastModifiedDate:{' '}
						{selectedFile.lastModifiedDate.toLocaleDateString()}
					</p>
				</div>
			) : (
				<p>Select a file to show details</p>
			)}
			<div>
				<button onClick={handleSubmission}>Submit</button>
			</div>
		</div>
	)
}