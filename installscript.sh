# Figure out what the S3 Trigger name is
S3_TRIGGER_NAME=$(jq -r '.function | to_entries[] | .key' amplify/backend/amplify-meta.json)

# Insert another IAM policy to allow the lambda function to call rekognition:detectLabels
cat << EOF > rekognition_policy_for_s3_trigger
        "RekognitionPolicy": {
            "DependsOn": [
                "LambdaExecutionRole"
            ],
            "Type": "AWS::IAM::Policy",
            "Properties": {
                "PolicyName": "rekognition-detect-labels",
                "Roles": [{
                    "Ref": "LambdaExecutionRole"
                }],
                "PolicyDocument": {
                    "Version": "2012-10-17",
                    "Statement": [{
                        "Effect": "Allow",
                        "Action": [
                            "rekognition:detectLabels"
                        ],
                        "Resource": "*"
                    }]
                }
            }
        },
EOF
TARGET_FILE="amplify/backend/function/$S3_TRIGGER_NAME/$S3_TRIGGER_NAME-cloudformation-template.json"
LINE=$(grep -n 'AmplifyResourcesPolicy' $TARGET_FILE | cut -d ":" -f 1)
{ head -n $(($LINE-1)) $TARGET_FILE; cat rekognition_policy_for_s3_trigger; tail -n +$LINE $TARGET_FILE; } > updated_s3_trigger_cf
rm $TARGET_FILE; mv updated_s3_trigger_cf $TARGET_FILE

# Rename the amplify-generated policy name in the trigger function cf template to prevent conflicts
sed -i -e "s/amplify-lambda-execution-policy/amplify-lambda-execution-policy-api/" $TARGET_FILE

# Rename the amplify-generated policy name in the s3 cf template to prevent conflicts
STORAGE_NAME=$(jq -r '.storage | to_entries[] | .key' amplify/backend/amplify-meta.json)
sed -i -e "s/amplify-lambda-execution-policy/amplify-lambda-execution-policy-storage/" amplify/backend/storage/$STORAGE_NAME/s3-cloudformation-template.json
