const https = require('https');

const adminToken = 'admin level persmission api token';

const org = 'vishnurachamallu';
const site = 'eds1-repoless';
const branch = 'main';

// Helper to make HTTPS requests
function makeRequest(url, options = {}, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });

    req.on('error', (err) => reject(err));

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function configureAemOverlay() {
  console.log('\n--- 1. Configuring AEM Content Overlay ---');
  const url = `https://admin.hlx.page/config/${org}/sites/${site}/content.json`;
  
  // Step A: Fetch current configuration
  console.log(`Fetching current configuration from: ${url}`);
  const getOptions = {
    method: 'GET',
    headers: {
      'x-auth-token': adminToken,
      'Accept': 'application/json'
    }
  };

  let currentConfig = {};
  try {
    const getRes = await makeRequest(url, getOptions);
    if (getRes.statusCode === 200) {
      currentConfig = JSON.parse(getRes.body);
      console.log('Current AEM Content Config:', JSON.stringify(currentConfig, null, 2));
    } else {
      console.log(`Failed to fetch current config (Status ${getRes.statusCode}). Starting fresh.`);
    }
  } catch (err) {
    console.error('Warning: could not fetch existing config:', err.message);
  }

  // Step B: Set source and overlay properties
  const payload = {
    source: currentConfig.source || {
      url: `https://author-p162613-e1741353.adobeaemcloud.com/bin/franklin.delivery/${org}/${site}/${branch}`,
      type: 'markup'
    },
    overlay: {
      url: `https://json2html.adobeaem.workers.dev/${org}/${site}/${branch}`,
      type: 'markup'
    }
  };

  console.log(`Updating overlay configuration...`);
  const postOptions = {
    method: 'POST',
    headers: {
      'x-auth-token': adminToken,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };

  try {
    const postRes = await makeRequest(url, postOptions, payload);
    console.log(`Response Status: ${postRes.statusCode}`);
    console.log('Response Body:', postRes.body);
    if (postRes.statusCode === 200 || postRes.statusCode === 201) {
      console.log('✅ AEM content overlay configured successfully!');
    } else {
      console.error('❌ Failed to configure AEM content overlay.');
    }
  } catch (err) {
    console.error('Error during AEM config POST:', err.message);
  }
}

async function configureJson2HtmlWorker() {
  console.log('\n--- 2. Configuring JSON2HTML Worker Endpoint Mappings ---');
  const url = `https://json2html.adobeaem.workers.dev/config/${org}/${site}/${branch}`;
  console.log(`Posting configurations to: ${url}`);

  const payload = [
    {
      path: '/users/',
      endpoint: 'https://randomuser.me/api/?seed={{id}}',
      regex: '/[^/]+$/',
      template: '/templates/user.html'
    }
  ];

  const postOptions = {
    method: 'POST',
    headers: {
      'Authorization': `token ${adminToken}`,
      'Content-Type': 'application/json'
    }
  };

  try {
    const res = await makeRequest(url, postOptions, payload);
    console.log(`Response Status: ${res.statusCode}`);
    console.log('Response Body:', res.body);
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('✅ JSON2HTML worker configured successfully!');
    } else {
      console.error('❌ Failed to configure JSON2HTML worker.');
    }
  } catch (err) {
    console.error('Error during JSON2HTML config POST:', err.message);
  }
}

async function run() {
  try {
    await configureAemOverlay();
    await configureJson2HtmlWorker();
  } catch (err) {
    console.error('Fatal error:', err.message);
  }
}

run();
