#!/bin/bash

# 🚀 KMP Supply Chain API - SDK Generation Script
# This script generates client libraries for multiple programming languages

set -e  # Exit on any error

echo "🚀 KMP Supply Chain API - SDK Generation"
echo "========================================"

# Check if OpenAPI Generator CLI is installed
if ! command -v openapi-generator &> /dev/null; then
    echo "❌ OpenAPI Generator CLI not found. Installing..."
    
    # Check if npm is available
    if command -v npm &> /dev/null; then
        npm install -g @openapitools/openapi-generator-cli
    elif command -v brew &> /dev/null; then
        brew install openapi-generator
    else
        echo "❌ Please install OpenAPI Generator CLI manually:"
        echo "   npm install -g @openapitools/openapi-generator-cli"
        echo "   OR"
        echo "   brew install openapi-generator"
        exit 1
    fi
fi

# Create output directory
OUTPUT_DIR="./generated-sdks"
mkdir -p "$OUTPUT_DIR"

# API specification URL
API_SPEC_URL="http://localhost:4000/openapi.json"

echo "📡 Using API specification: $API_SPEC_URL"
echo "📁 Output directory: $OUTPUT_DIR"
echo ""

# Function to generate SDK for a specific language
generate_sdk() {
    local language=$1
    local output_path="$OUTPUT_DIR/$language"
    local package_name=$2
    local additional_properties=$3
    
    echo "🔧 Generating $language SDK..."
    
    # Remove existing output directory
    rm -rf "$output_path"
    
    # Generate SDK
    openapi-generator generate \
        -i "$API_SPEC_URL" \
        -g "$language" \
        -o "$output_path" \
        --package-name "$package_name" \
        --additional-properties="$additional_properties" \
        --skip-validate-spec
    
    echo "✅ $language SDK generated successfully!"
    echo "📁 Location: $output_path"
    echo ""
}

# Generate TypeScript/JavaScript SDK
echo "🟦 Generating TypeScript SDK..."
generate_sdk "typescript-fetch" "kmp-supply-chain-sdk" "npmName=@kmp/supply-chain-sdk,npmVersion=1.0.0,withInterfaces=true,typescriptThreePlus=true"

# Generate Python SDK
echo "🐍 Generating Python SDK..."
generate_sdk "python" "kmp_supply_chain" "packageName=kmp_supply_chain,projectName=kmp-supply-chain,packageVersion=1.0.0,packageUrl=https://github.com/kmp/supply-chain-python-sdk"

# Generate Java SDK
echo "☕ Generating Java SDK..."
generate_sdk "java" "com.kmp.supplychainapi" "groupId=com.kmp,artifactId=supply-chain-api,artifactVersion=1.0.0,developerName=KMP Team,developerEmail=dev@kmp-api.com"

# Generate C# SDK
echo "🔷 Generating C# SDK..."
generate_sdk "csharp" "KMP.SupplyChainAPI" "packageName=KMP.SupplyChainAPI,packageVersion=1.0.0,clientPackage=KMP.SupplyChainAPI.Client"

# Generate Go SDK
echo "🐹 Generating Go SDK..."
generate_sdk "go" "kmp-supply-chain-go" "packageName=supplychainapi,packageVersion=1.0.0,packageUrl=github.com/kmp/supply-chain-go-sdk"

# Generate PHP SDK
echo "🐘 Generating PHP SDK..."
generate_sdk "php" "KMP\\SupplyChainAPI" "packageName=kmp/supply-chain-api,composerVendorName=kmp,composerProjectName=supply-chain-api"

# Generate Ruby SDK
echo "💎 Generating Ruby SDK..."
generate_sdk "ruby" "kmp-supply-chain" "gemName=kmp-supply-chain,gemVersion=1.0.0,moduleName=KmpSupplyChain"

echo "🎉 All SDKs generated successfully!"
echo ""
echo "📦 Generated SDKs:"
echo "   📁 TypeScript: $OUTPUT_DIR/typescript-fetch"
echo "   📁 Python:     $OUTPUT_DIR/python"
echo "   📁 Java:       $OUTPUT_DIR/java"
echo "   📁 C#:         $OUTPUT_DIR/csharp"
echo "   📁 Go:         $OUTPUT_DIR/go"
echo "   📁 PHP:        $OUTPUT_DIR/php"
echo "   📁 Ruby:       $OUTPUT_DIR/ruby"
echo ""
echo "🚀 Next Steps:"
echo "   1. Review generated SDKs in the $OUTPUT_DIR directory"
echo "   2. Test the SDKs with your applications"
echo "   3. Publish to package repositories (npm, PyPI, Maven, etc.)"
echo "   4. Update documentation with installation instructions"
echo ""
echo "💡 Pro Tips:"
echo "   - Customize additional properties for each language as needed"
echo "   - Set up CI/CD pipelines to auto-generate SDKs on API updates"
echo "   - Consider versioning SDKs alongside your API versions"
echo ""
echo "✨ Happy coding!" 