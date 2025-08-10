#!/usr/bin/env node

const axios = require('axios');

const API_BASE = 'http://localhost:3001';

async function quickAuthTest() {
  console.log('🧪 QUICK AUTHENTICATION TEST');
  console.log('============================');
  
  try {
    // Step 1: Register new user with company ID 1
    const timestamp = Date.now();
    const testEmail = `quicktest${timestamp}@test.com`;
    
    console.log('\n1. 📝 Registering user...');
    const registerResponse = await axios.post(`${API_BASE}/api/auth/register`, {
      email: testEmail,
      password: 'QuickTest123!',
      firstName: 'Quick',
      lastName: 'Test',
      companyId: 1,
      role: 'member'
    });
    
    console.log('✅ Registration Success:', {
      userId: registerResponse.data.user.id,
      companies: registerResponse.data.user.companies,
      hasToken: !!registerResponse.data.token
    });
    
    // Step 2: Login with same credentials
    console.log('\n2. 🔑 Testing login...');
    const loginResponse = await axios.post(`${API_BASE}/api/auth/login`, {
      email: testEmail,
      password: 'QuickTest123!'
    });
    
    console.log('✅ Login Success:', {
      hasToken: !!loginResponse.data.token,
      tokenLength: loginResponse.data.token?.length
    });
    
    const token = loginResponse.data.token;
    
    // Step 3: Test company dashboard access
    console.log('\n3. 🏢 Testing company dashboard...');
    const dashboardResponse = await axios.get(`${API_BASE}/api/company/1/dashboard`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ Dashboard Success:', {
      status: dashboardResponse.status,
      hasData: !!dashboardResponse.data.company,
      totalEvents: dashboardResponse.data.totalEvents
    });
    
    // Step 4: Test supply chain event submission
    console.log('\n4. 📦 Testing supply chain event...');
    const eventResponse = await axios.post(`${API_BASE}/api/supply-chain/event`, {
      productId: `QUICK-TEST-${timestamp}`,
      eventType: 'QUALITY_CHECK',
      location: 'Test Factory',
      data: { result: 'PASSED' }
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ Event Success:', {
      success: eventResponse.data.success,
      eventId: eventResponse.data.eventId,
      hasBlockchain: !!eventResponse.data.blockchainExplorer
    });
    
    console.log('\n🎉 ALL AUTHENTICATION TESTS PASSED!');
    return true;
    
  } catch (error) {
    console.error('\n❌ Test Failed:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      step: error.config?.url
    });
    return false;
  }
}

quickAuthTest(); 