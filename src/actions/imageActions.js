import S3 from 'react-aws-s3'
import axios from 'axios'
// import auth from '../components/security/auth'
import ShortUniqueId from 'short-unique-id';
import { difference } from '../components/utilities/setsFunctions';
import S3Client from "../aws-s3/aws-s3"
// CODE FOR MANAGING IMAGES IN AMAZON S3 BUCKET; MANAGES POSTS' COVER IMAGE AND USER PROFILE IMAGE
    // <----- START ------->

const suid = new ShortUniqueId({ length: 16 });

const config = {
    bucketName: process.env.REACT_APP_S3_BUCKET,
    region: process.env.REACT_APP_REGION,
    accessKeyId: process.env.REACT_APP_ACCESS_KEY_ID,
    secretAccessKey: process.env.REACT_APP_SECRET_ACCESS_KEY
}

const ReactS3Client = new S3(config)

// Testing my own AWS S3 client
const MyS3Client = new S3Client(config);

const token = localStorage.getItem('token');

const uploadImage =  async (file, isProfileImage) => {
    // Upload the image to Amazon S3 bucket
    // if (file && token) {
    if (true) {
        console.log("upload image called")
        try {
            if (!isProfileImage) {
                // response = await ReactS3Client.uploadFile(file)
                try {
                    MyS3Client.uploadFile(file)
                } catch(e) {
                    console.log(e)
                }
                
            } else {
                await ReactS3Client.uploadFile(file, `profileimages/${suid()}`)
            }
            // 'images_attributes' array will be later processed by Rails backend API; do not change the name 'images_attributes', it is required by Rails API
            return []
        } catch(error) { 
            console.log(error) 
            return []
        }
    } return []
}

// const uploadImage =  async (file, isProfileImage) => {
//     // Upload the image to Amazon S3 bucket
//     if (file && token) {
//         console.log("upload image called")
//         try {
//             let response
//             if (!isProfileImage) {
//                 response = await ReactS3Client.uploadFile(file)              
//             } else {
//                 response = await ReactS3Client.uploadFile(file, `profileimages/${suid()}`)
//             }
//             // 'images_attributes' array will be later processed by Rails backend API; do not change the name 'images_attributes', it is required by Rails API
//             const images_attributes = [{
//                 name: file.name,
//                 size: file.size,
//                 url: response.location,
//                 s3key: response.key
//             }]
//             return images_attributes
//         } catch(error) { 
//             console.log(error) 
//             return []
//         }
//     } return []
// }

const deleteImage = async (postImage) => {
    // Delete the image from Amazon S3 bucket
    if (token) {
        console.log("delete image called")
        await ReactS3Client.deleteFile(postImage.s3key)
            .catch((error) => {
                console.error('Error:', error);
            });
        console.log("Delete image from S3 was called")
        // This empty array response will be later processed by Rails backend API; an empty erray will let Rails know 
        // that the 'images_attributes' array is empty and, therefore, if there is an image on the associated post or user, the image object will be deleted
        return []
    } return []
}

const updateImage = async (postImage, imageData) => {
    // Update the image in Amazon S3 bucket
    if (token) {
        console.log("update image called")
        await ReactS3Client.uploadFile(imageData, postImage.s3key)
        .catch(error => { 
            console.log(error) 
            return [postImage]
        })
        const images_attributes = [{
            name: imageData.name,
            size: imageData.size,
            url: postImage.url,
            s3key: postImage.s3key
        }]
        return images_attributes
    } return []
}

export function manageImageForNewDraftOrPost(imageData) {
    // returns a promise; promise is resolved in Post Editor
    return uploadImage(imageData)
}

export function manageImageForDraftOrPost(currentPostOrUser, imageState, isProfileImage = false) {
    // This function may return a promise; promise is resolved in Post Editor
    // debugger
    console.log("Image manager called")
    let images = currentPostOrUser.images
    let imageData = imageState
    // If the post or user has an image on record, and there no image included in post editor or user profile, delete the post's or user's record image
    if (images[0] !== undefined && imageData === undefined) {
        return deleteImage(images[0])
    // If the post or user has an image on record, and there is an image included in post editor or user profile, if there is a difference in file name or size, replace the post's or user's record image; otherwise, leave the current record's image
    } else if (images[0] !== undefined && imageData !== undefined) {
        if ( images[0].name !== imageData.name || images[0].size !== imageData.size ) {
            return updateImage(images[0], imageData)
        } return [images[0]]
    // If the post or user has no image on record and there is an image included in post editor or user profile, upload the image to Amazon S3
    } else if (images[0] === undefined && imageData !== undefined) {
        return uploadImage(imageData, isProfileImage)
    } return []
}

    // <----- END ------->


// CODE FOR MANAGING POST'S BODY IMAGES WHEN UPLOADED USING THE POST EDITOR'S UPLOAD IMAGE FEATURE;
// IMAGES ARE UPLOADED TO AN IMGUR BUCKET; CODE SENDS IMAGES' URLS TO RUBY ON RAILS BACKEND SO BACKEND TAKES CARE OF DESTROYING THE IMAGES IN IMGUR BUCKET
// CODE ALSO MANAGEES THE IMAGES REDUX STORE
    // <----- START ------->

// helper function
export function extractBodyImages(data) {
    const entityMapArray = Object.values(data.entityMap);
    const imagesUrls = new Set();
    if(entityMapArray.length) {
        entityMapArray.forEach( entity => {
            if(entity.type === "IMAGE") {
                const src = entity.data.src
                if (src.includes("i.imgur.com/")) {
                    imagesUrls.add(src)
                }
            }
        })
    }
    return imagesUrls;
}

export function registerDraftOrPostBodyImages(data, state) {
    return async (dispatch) => {
        console.log("register images called")
        const images = extractBodyImages(data);   //'images' is a Set, not an array
        if(images.size) {
            if(state.type === "initial") {
                dispatch({ type: "REGISTER_IMAGES", payload: images } )
                console.log(`${images.size} images registered in initial states`) 
            } 
            else if(state.type === "final") {
                dispatch({ type: "REGISTER_FINAL_STATE_IMAGES", payload: images } )
                console.log(`${images.size} images registered in final state`) 
            }
            
        } else  {
            console.log("No images registered")
        }
    }
}

export function scheduleImagesForDestruction(initialStateImages, finalStateImages) {
    const initial = initialStateImages;
    const final = finalStateImages;
    console.log("Initial statte images in images schdeuler", initial)
    // if there are registered images
    if (initial.size) {
        return new Promise((resolve, reject) => {            
            setTimeout( () => {
                const markedForDestruction = difference(initial, final);
                console.log("Marked for destruction", markedForDestruction)
                if (markedForDestruction) {                           // convert the set into an array
                    axios.post("/images/schedule-for-destruction", {urls: [...markedForDestruction]})
                        .then(resp => resolve(console.log("Image destruction scheduliing successful")))
                        .catch(error => resolve(console.log(error)))
                } 
                else {
                    resolve(console.log("No scheduled images for destruciton"))
                }
            }, 1000)
            console.log("hello!!!!")
        })
    }
    else console.log("No scheduled images for destruciton")
}

// <----- END ------->



