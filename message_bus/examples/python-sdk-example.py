#!/usr/bin/env python3
"""
🚀 KMP Supply Chain API - Python SDK Example

This example demonstrates how to use the generated Python SDK
to interact with the KMP Supply Chain API.

⚠️ PREREQUISITE: Generate the Python SDK first:
   npm run generate:sdks
   or manually: openapi-generator generate -i http://localhost:4000/openapi.json -g python -o ./generated-sdks/python

📦 Installation (after SDK generation):
   cd generated-sdks/python
   pip install -e .
"""

import json
import asyncio
from typing import Optional, Dict, Any

# NOTE: Imports will work after SDK generation
# import kmp_supply_chain
# from kmp_supply_chain.api import default_api
# from kmp_supply_chain.model.supply_chain_event import SupplyChainEvent
# from kmp_supply_chain.model.user_registration import UserRegistration
# from kmp_supply_chain.model.user_login import UserLogin
# from kmp_supply_chain.model.api_key_create import ApiKeyCreate


class KMPSupplyChainClient:
    """
    🚀 KMP Supply Chain API Python Client
    
    A high-level wrapper around the generated Python SDK for easier usage.
    """
    
    def __init__(self, base_url: str = "http://localhost:4000", 
                 api_key: Optional[str] = None, 
                 jwt_token: Optional[str] = None):
        """
        Initialize the KMP Supply Chain client.
        
        Args:
            base_url: API base URL
            api_key: API key for authentication
            jwt_token: JWT token for authentication
        """
        # NOTE: This will work after SDK generation
        # configuration = kmp_supply_chain.Configuration(
        #     host=base_url,
        #     api_key={'X-API-Key': api_key} if api_key else {},
        #     access_token=jwt_token
        # )
        # 
        # self.api_client = kmp_supply_chain.ApiClient(configuration)
        # self.api_instance = default_api.DefaultApi(self.api_client)
        
        self.base_url = base_url
        self.api_key = api_key
        self.jwt_token = jwt_token
        print(f"🚀 Initialized KMP Supply Chain client for {base_url}")

    def register_user(self, email: str, password: str, first_name: str, 
                     last_name: str, company_id: Optional[int] = None):
        """
        📝 Register a new user
        
        Args:
            email: User's email address
            password: User's password
            first_name: User's first name
            last_name: User's last name
            company_id: Optional company ID to associate user with
        
        Returns:
            Registration response with user details and JWT token
        """
        try:
            # user_data = UserRegistration(
            #     email=email,
            #     password=password,
            #     first_name=first_name,
            #     last_name=last_name,
            #     company_id=company_id
            # )
            # 
            # response = self.api_instance.api_auth_register_post(user_data)
            
            print(f"✅ User registered successfully: {email}")
            # return response
            
        except Exception as error:
            print(f"❌ Registration failed: {error}")
            raise error

    def login_user(self, email: str, password: str):
        """
        🔑 Login user and get JWT token
        
        Args:
            email: User's email address
            password: User's password
            
        Returns:
            Login response with JWT token
        """
        try:
            # credentials = UserLogin(email=email, password=password)
            # response = self.api_instance.api_auth_login_post(credentials)
            
            print("✅ Login successful")
            # print(f"🎫 JWT Token: {response.token}")
            
            # Update the client with the new token
            # self.jwt_token = response.token
            # self._update_token(response.token)
            
            # return response
            
        except Exception as error:
            print(f"❌ Login failed: {error}")
            raise error

    def create_api_key(self, name: str, scopes: list, expires_at: Optional[str] = None):
        """
        🔧 Create API key for programmatic access
        
        Args:
            name: Descriptive name for the API key
            scopes: List of permission scopes
            expires_at: Optional expiration date
            
        Returns:
            API key response with generated key
        """
        try:
            # key_data = ApiKeyCreate(
            #     name=name,
            #     scopes=scopes,
            #     expires_at=expires_at
            # )
            # 
            # response = self.api_instance.api_auth_api_keys_post(key_data)
            
            print("✅ API Key created successfully")
            # print(f"🔑 Key: {response.key}")
            # print(f"🏷️ Prefix: {response.key_prefix}")
            
            # return response
            
        except Exception as error:
            print(f"❌ API Key creation failed: {error}")
            raise error

    def submit_supply_chain_event(self, product_id: str, location: str, 
                                event_type: str, batch_id: Optional[str] = None,
                                metadata: Optional[Dict[str, Any]] = None):
        """
        📦 Submit supply chain event
        
        Args:
            product_id: Unique identifier for the product
            location: Location where event occurred
            event_type: Type of supply chain event
            batch_id: Optional batch identifier
            metadata: Additional event-specific data
            
        Returns:
            Event submission response with transaction details
        """
        try:
            # event_data = SupplyChainEvent(
            #     product_id=product_id,
            #     location=location,
            #     event_type=event_type,
            #     batch_id=batch_id,
            #     metadata=metadata or {}
            # )
            # 
            # response = self.api_instance.api_supply_chain_event_post(event_data)
            
            print("✅ Supply chain event submitted successfully!")
            # print(f"📋 Transaction ID: {response.transaction_id}")
            # print(f"🌐 Explorer Link: {response.blockchain_explorer}")
            # print(f"💰 Fee Info: {response.fees}")
            # print(f"📊 Payload Handling: {response.payload_handling}")
            
            # return response
            
        except Exception as error:
            print(f"❌ Event submission failed: {error}")
            raise error

    def get_product_trace(self, product_id: str):
        """
        🔍 Get product traceability
        
        Args:
            product_id: Product identifier to trace
            
        Returns:
            Product traceability response with event history
        """
        try:
            # response = self.api_instance.api_product_product_id_trace_get(product_id)
            
            print(f"🔍 Traceability for product {product_id}:")
            # print(f"📊 Total events: {response.total_events}")
            
            # if response.events:
            #     for i, event in enumerate(response.events, 1):
            #         print(f"  {i}. {event.event_type} at {event.location} ({event.timestamp})")
            #         tx_short = event.transaction_hash[:16] + "..." if event.transaction_hash else "N/A"
            #         print(f"     Status: {event.status}, TX: {tx_short}")
            
            # return response
            
        except Exception as error:
            print(f"❌ Failed to get product trace: {error}")
            raise error

    def get_company_dashboard(self, company_id: int, days: int = 30):
        """
        📊 Get company dashboard
        
        Args:
            company_id: Company ID
            days: Number of days to include in statistics
            
        Returns:
            Company dashboard with analytics
        """
        try:
            # response = self.api_instance.api_company_company_id_dashboard_get(
            #     company_id, days=days
            # )
            
            print(f"📊 Company {company_id} Dashboard ({days} days):")
            # print(f"📈 Event Stats: {response.events}")
            # print(f"💰 Transaction Stats: {response.transactions}")
            # print(f"📝 Recent Events: {len(response.recent_events) if response.recent_events else 0}")
            
            # return response
            
        except Exception as error:
            print(f"❌ Failed to get dashboard: {error}")
            raise error

    def get_transaction_status(self, transaction_hash: str):
        """
        🔍 Check transaction status
        
        Args:
            transaction_hash: Transaction hash to check
            
        Returns:
            Transaction status response
        """
        try:
            # response = self.api_instance.api_transaction_transaction_hash_status_get(
            #     transaction_hash
            # )
            
            tx_short = transaction_hash[:16] + "..." if len(transaction_hash) > 16 else transaction_hash
            print(f"🔍 Transaction {tx_short} Status:")
            # print(f"📊 Status: {response.status}")
            # print(f"✅ Confirmations: {response.confirmations}")
            # print(f"🏗️ Block Height: {response.block_height}")
            
            # return response
            
        except Exception as error:
            print(f"❌ Failed to get transaction status: {error}")
            raise error

    def get_system_health(self):
        """
        📊 Get system health
        
        Returns:
            System health status
        """
        try:
            # response = self.api_instance.health_get()
            
            print("🏥 System Health Check:")
            # print(f"📊 Status: {response.status}")
            # print(f"🗄️ Database: {response.database}")
            # print(f"💾 Storage: {response.storage}")
            # print(f"🔗 Confirmations: {response.confirmations}")
            # print(f"🌐 WebSocket: {response.websocket}")
            
            # return response
            
        except Exception as error:
            print(f"❌ Health check failed: {error}")
            raise error

    def _update_token(self, token: str):
        """
        🔄 Update JWT token in the API client
        """
        # configuration = kmp_supply_chain.Configuration(
        #     host=self.base_url,
        #     api_key={'X-API-Key': self.api_key} if self.api_key else {},
        #     access_token=token
        # )
        # 
        # self.api_client = kmp_supply_chain.ApiClient(configuration)
        # self.api_instance = default_api.DefaultApi(self.api_client)
        pass


def main():
    """
    🚀 Example Usage
    """
    print("🚀 KMP Supply Chain API - Python SDK Example")
    print("============================================")

    # Initialize client
    client = KMPSupplyChainClient(
        base_url="http://localhost:4000",
        # You can use either API key or JWT token
        api_key="your-api-key-here"
        # jwt_token="your-jwt-token-here"
    )

    try:
        # 1. Check system health
        print("\n🏥 Checking system health...")
        client.get_system_health()

        # 2. Submit a supply chain event
        print("\n📦 Submitting supply chain event...")
        client.submit_supply_chain_event(
            product_id="PYTHON_SDK_EXAMPLE_001",
            location="SDK_TESTING_FACILITY",
            event_type="QUALITY_CHECK",
            batch_id="BATCH_PY_001",
            metadata={
                "inspector": "Python SDK",
                "grade": "PREMIUM",
                "automated": True,
                "sdk_version": "1.0.0"
            }
        )

        # 3. Get product traceability  
        print("\n🔍 Getting product traceability...")
        client.get_product_trace("PYTHON_SDK_EXAMPLE_001")

        # 4. Check transaction status (example)
        print("\n🔍 Checking transaction status...")
        client.get_transaction_status("example_transaction_hash_here")

        # 5. Get company dashboard (requires authentication)
        # print("\n📊 Getting company dashboard...")
        # client.get_company_dashboard(1)

        print("\n✅ Example completed successfully!")

    except Exception as error:
        print(f"\n❌ Example failed: {error}")


if __name__ == "__main__":
    main() 