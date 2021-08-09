const Bucketpolicyexample =
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicListGet",
            "Effect": "Allow",
            "Principal": "*",
            "Action": [
                "s3:List*",
                "s3:Get*"
            ],
            "Resource": [
                "arn:aws:s3:::devblogimages",
                "arn:aws:s3:::devblogimages/*"
            ]
        }
    ]
}

const gettingallfiles = await s3.listFiles()