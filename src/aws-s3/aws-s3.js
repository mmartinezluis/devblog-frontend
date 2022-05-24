// Documentation: 
// This software-development-kid performs 'browser-based uploads to Amazon S3'.
// For official documention on the above process, refer to the "Amazon Simple Storage Service API Reference",
// section "Authenticating Requests in Browser-Based Uploads Using POST (AWS Signature Version 4)", 
// subsections "Broswer-Based uploads Using HTTP-POST", "Calculating a Signature", "POST Policy", 
// and "Example: Browser-Based Upload using HTTP POST (Using AWS Signature Version 4)"

class S3Client {
    static crypto = require('crypto');
    static crypto2  = require('crypto-js');
    static baseUrl = "";
    
    // constructor ({ bucketName, region, accessKeyId, secretAccessKey, baseUrl, monitorProgress= false, parseFileName = true  }) {
    constructor (config) {
        this.config = config;        
        // if(typeof(bucketName) === "string" && bucketName.length) {this.config.bucketName = bucketName;} else {throw new Error("'bucketName' must be a nonempty string." );}
        // this.config["bucketName"] = bucketName
        // this.config["region"] = region
        // this.config["accessKeyId"] = accessKeyId
        // this.config["secretAccessKey"] = secretAccessKey
        // this.config["baseUrl"] = baseUrl ? baseUrl : 'https://' + bucketName + '.s3.' + region + '.amazonaws.com'
        // this.config["monitorProgress"] = monitorProgress
        // this.config["parseFileName"] = parseFileName
        // S3Client.baseUrl = 'https://' + bucketName + '.s3.' + region + '.amazonaws.com'
        
    }

    request(headers, path, method, queryStringObject, payload, callback) {

        // sanity check the config object
        // Required params
        try{
        if(typeof(this.config) !== "object" || (this.config instanceof Array) || !Object.keys(this.config).length ) throw new Error("The argument for the constructor of the " + this.constructor.name + " class must be an nonempty object");
        if(typeof(this.config.bucketName) !== "string" || !this.config.bucketName.trim().length ) throw new Error("'bucketName' must be a nonempty string");
        if(typeof(this.config.region) !== "string" || !this.config.region.trim().length ) throw new Error("'region' must be a nonempty string");
        if(typeof(this.config.accessKeyId) !== "string" || !this.config.accessKeyId.trim().length ) throw new Error("'accessKeyId' must be a nonempty string");
        if(typeof(this.config.secretAccessKey) !== "string" || !this.config.secretAccessKey.trim().length ) throw new Error("'secretAccessKey' must be a nonempty string");
        // Optional params
        if(this.config.baseUrl !== undefined && (typeof(this.config.baseUrl) !== "string" || !this.config.baseUrl.trim().length)){ throw new Error("If included, 'baseUrl' must be a nonempty string") } else this.config.baseUrl = 'https://' + this.config.bucketName + '.s3.' + this.config.region + '.amazonaws.com' 
        if(this.config.dirName !== undefined && (typeof(this.config.dirName) !== "string" || !this.config.dirName.trim().length)){ throw new Error("If included, 'dirName' must be a nonempty string") } else this.config.dirName = ""
        if(this.config.parseFileName !== undefined && typeof(this.config.parseFileName) !== "boolean"){ throw new Error("If included, 'parseFileName' must be a boolean") } else this.config.parseFileName = true
        if(this.config.monitorProgress !== undefined && typeof(this.config.monitorProgress) !== "boolean"){ throw new Error("If included, 'parseFileName' must be a boolean") } else this.config.monitorProgress = true 

        

        // Creating the stringToSign using the bucket Policy
        const tenMinutes = 6e5;
        const isoDate = (new Date(new Date().getTime() + tenMinutes)).toISOString();
        const date = isoDate.split("T")[0].split("-").join("");  // yyyymmdd
        const formattedIso = isoDate.split("-").join("").split(":").join("").split(".").join("");

        // Note: The optional "encoding" parameter from "Buffer.from(string[,enconding])" defaults to utf8
        // generate Policy method
        const policy = Buffer.from(
            JSON.stringify(
                { 
                    expiration: isoDate,
                    conditions: [
                        {"bucket": this.config.bucketName},
                        {"acl": "public-read"},
                        ["starts-with", "$key", ""],
                        ["starts-with", "$Content-Type", ""],
                        {"x-amz-meta-uuid": "14365123651274"},
                        {"x-amz-server-side-encryption": "AES256"},
                        ["starts-with", "$x-amz-meta-tag", ""],
                        {"x-amz-credential": `${this.config.accessKeyId}/${date}/${this.config.region}/s3/aws4_request`},
                        {"x-amz-algorithm": "AWS4-HMAC-SHA256"},
                        {"x-amz-date": formattedIso }
                    ] 
                }
            )
        ).toString('base64').replaceAll(/[$\n\r]/g, "")

        // generateKey method
        // Calculating the SigningKey
        let c = S3Client.crypto;
        // c ( algorithm, key, ..rest(string))
        const dateKey = c.createHmac('sha256', "AWS4" + this.config.secretAccessKey).update(date).digest();
        const dateRegionKey = c.createHmac('sha256', dateKey).update(this.config.region).digest();
        const dateRegionServiceKey = c.createHmac('sha256', dateRegionKey).update('s3').digest();
        const signingKey = c.createHmac('sha256', dateRegionServiceKey).update('aws4_request').digest();
        const signature = c.createHmac('sha256', signingKey).update(policy).digest('hex');
        // signing key = HMAC-SHA256(HMAC-SHA256(HMAC-SHA256(HMAC-SHA256("AWS4" + "<YourSecretAccessKey>","20130524"),"us-east-1"),"s3"),"aws4_request")
                
        // Create a form to send to AWS S3
        let formData = new FormData();
        // Append 
        formData.append("key", payload.name)
        formData.append("acl", "public-read")
        formData.append("content-type", payload.type)
        formData.append("x-amz-meta-uuid", "14365123651274")
        formData.append("x-amz-server-side-encryption", 'AES256')
        formData.append("x-amz-credential", `${this.config.accessKeyId}/${date}/${this.config.region}/s3/aws4_request`)
        formData.append("x-amz-algorithm", 'AWS4-HMAC-SHA256')
        formData.append("x-amz-date", formattedIso)
        formData.append("x-amz-meta-tag", "")
        formData.append("policy", policy)
        formData.append("x-amz-signature", signature)
        formData.append("file", payload)

        // let requestUrl = path + '?';
        let requestUrl = path;
        let counter = 0;
        for(let queryKey in queryStringObject){
            if(queryStringObject.hasOwnProperty(queryKey)){
                counter++;
                if(counter > 1){
                    requestUrl+= '&';
                }
                requestUrl+= queryKey + '=' +queryStringObject[queryKey];
            }
        }
        console.log(payload)
        
        let xhr = new XMLHttpRequest();
        xhr.open(method, requestUrl, true);
        xhr.onreadystatechange = function() {
            if(xhr.readyState === XMLHttpRequest.DONE) {
                let statusCode = xhr.status;
                // let responseReturned = xhr.responseText;
                if(callback){
                    try {
                        // let parsedResponse = JSON.parse(responseReturned);
                        // callback(statusCode, responseReturned, xhr);
                        
                        callback(statusCode, undefined, xhr);
                    } catch(e){
                        callback(statusCode, false);
                    }
                }
            }
        }
        xhr.send(formData);    

        } catch(error){ console.log(error)}
    }
    
    // Perform sanity check for instance constructor properties
    uploadFile(file, fileNmae, dirName) {
        this.request(this.config, S3Client.baseUrl, 'POST', {}, file, function(statusCode, responseReturned, xhr){
            console.log(statusCode);
            console.log(responseReturned);
            console.log(xhr);
            return responseReturned;
        });
    }

    static generateKey(file, fileName, dirName) {

        // if user does not specify a file name
        // this.crypto.randomBytes(11).toString('hex')
        // if user specifies file name, need to sanity check file name; replace the below special characters with empty space
        // https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-keys.html
        // file.name.replaceAll(/[ \\ } ^ \] % \[ ` # \| > " < ~ ' \n \r &{ ]/g, "")
    }


    addDirectory(key, value) {
        S3Client.directories[key] = value
    }

    getDirectory(){

    }

    directories() {

    }

    // CRUD ACTIONS
    get(){

    }

    upload(paplod){
        // Sanity check payload
    }

    update(payload){

    }

    delete(payload){

    }
}

module.exports = S3Client;

