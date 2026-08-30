/* eslint-disable no-console */
const https = require('https');

const adminToken = 'github/google auth_token cookie from admin.hlx.page/profile';

const org = 'vishnurachamallu';
const site = 'eds1-repoless-subsite2';
const baseRepo = 'eds1-repoless';

function makeRequest(url, options = {}, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body,
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

async function createSiteConfig() {
  console.log(`\n--- Creating Site Configuration for ${site} ---`);
  const url = `https://admin.hlx.page/config/${org}/sites/${site}.json`;

  const payload = {
    code: {
      owner: org,
      repo: baseRepo,
      source: {
        type: 'github',
        url: `https://github.com/${org}/${baseRepo}`,
      },
    },
    content: {
      source: {
        url: `https://author-p162613-e1741353.adobeaemcloud.com/bin/franklin.delivery/${org}/${site}/main`,
        type: 'markup',
      },
    },
  };

  const options = {
    method: 'POST',
    headers: {
      'x-auth-token': adminToken,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  };

  try {
    const res = await makeRequest(url, options, payload);
    console.log(`Response Status: ${res.statusCode}`);
    console.log('Response Body:', res.body);
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('✅ Site configuration created successfully!');
    } else {
      console.error('❌ Failed to create site configuration.');
    }
  } catch (err) {
    console.error('Error during site config POST:', err.message);
  }
}

async function run() {
  await createSiteConfig();
}

run();
