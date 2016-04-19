var fs = require('fs');
var https = require('https');
var apiListBranchesPath = '/repos/facebook/react-native/branches'

/**
 * ghApiRequest - returns a JSON response from GitHub API
 * @param  {string}   path - to GitHub API endpoint
 * @param  {Function} cb - callback with the JSON response from the GitHub API
 */
function ghApiRequest(path, cb) {
  var options = {
    hostname: 'api.github.com',
    path: path,
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'Yo'
    }
  };

  var req = https.request(options, function(res) {
    var body = '';
    res.on('data', function(d) {
      body += d;
    });

    res.on('end', function() {
      cb(JSON.parse(body));
    });
  });

  req.end();

  req.on('error', function(e) {
    console.error('error', e);
  });
}


/**
 * lastTwoStableBranches - get's the last two stable branches from react-native repo
 * @param  {Function} cb - callback with the array of strings (branches version)
 */
function lastTwoStableBranches(cb) {
  ghApiRequest(apiListBranchesPath, function(res) {
    var stableBranches = [];
    res.forEach(function(branch) {
      if (branch.name.indexOf('-stable') !== -1) {
        stableBranches.push(branch.name);
      }
    });
    cb([stableBranches.slice(-2)[0], stableBranches.slice(-1)[0]]);
  });
}


/**
 * classifyCommits creates a draft {object} with classified commits and their urls
 * @param  {array} commits - list of commit's objects returned from GitHub API
 * @return {object} draft - classified commits
 */
function classifyCommits(commits) {
  var draft = {
    core: {
      features: [],
      bugs: []
    },
    android: {
      features: [],
      bugs: []
    },
    ios: {
      features: [],
      bugs: []
    },
    other: {
      features: [],
      bugs: []
    }
  }

  commits.forEach(function(item) {
    var messageTitle = item.commit.message.split('\n\n')[0];
    var commitUrl = item.html_url;

    if (messageTitle.toLowerCase().search('showcase') !== -1) {
      return;
    }

    if (messageTitle.toLowerCase().search(/ios|RCT'/) !== -1) {
      if (messageTitle.toLowerCase().search('add') !== -1) {
        // ios feature
        draft.ios.features.push('- ' + messageTitle + ' - ' + commitUrl);
      } else if (messageTitle.toLowerCase().search('fix') !== -1) {
        // ios bug fix
        draft.ios.bugs.push('- ' + messageTitle + ' - ' + commitUrl);
      }

    } else if (messageTitle.toLowerCase().search(/android|java/) !== -1) {
      if (messageTitle.toLowerCase().search('add') !== -1) {
        // android feature
        draft.android.features.push('- ' + messageTitle + ' - ' + commitUrl);
      } else if (messageTitle.toLowerCase().search('fix') !== -1) {
        // android bug fix
        draft.android.bugs.push('- ' + messageTitle + ' - ' + commitUrl);
      }

    } else if (messageTitle.toLowerCase().search('packager') !== -1) {
      if (messageTitle.toLowerCase().search('add') !== -1) {
        // core feature
        draft.core.features.push('- ' + messageTitle + ' - ' + commitUrl);
      } else if (messageTitle.toLowerCase().search('fix') !== -1) {
        // core bug fix
        draft.core.bugs.push('- ' + messageTitle + ' - ' + commitUrl);
      }

    } else {
      if (messageTitle.toLowerCase().search('add') !== -1) {
        // other feature
        draft.other.features.push('- ' + messageTitle + ' - ' + commitUrl);
      } else if (messageTitle.toLowerCase().search('fix') !== -1) {
        // other bug fix
        draft.other.bugs.push('- ' + messageTitle + ' - ' + commitUrl);
      }
    }
  });

  return draft;
}


/**
 * Creates a draft.md file with a release notes draft
 * @param {object} draft - draft object returned from classifyCommits method.
 * @param {string} compareUrl - url to GitHub's compare changes between branches (i.e. https://github.com/facebook/react-native/compare/0.21-stable...0.22-stable).
 * @param {number} totalCommits - total number of commits
 * @param {string} version - version of react-native the release notes are being prepared for
 */
function createDraft(draft, compareUrl, totalCommits, version) {
  var writeStream = fs.createWriteStream('draft.md', { flags: 'w' });

  var intro = "Thanks to X contributors who put [" + totalCommits + " commits](" + compareUrl + ") into **React Native " + version + "**!\n\n";

  writeStream.write(intro);
  writeStream.write('## New features\n\n');

  draft.core.features.forEach(function(feature) {
    writeStream.write(feature + "\n");
  });

  writeStream.write("\n");

  writeStream.write('## Bug fixes\n\n');

  draft.core.bugs.forEach(function(bug) {
    writeStream.write(bug + "\n");
  });

  writeStream.write('\n## Android\n\n### New features\n\n');

  draft.android.features.forEach(function(feature) {
    writeStream.write(feature + "\n");
  });

  writeStream.write('\n### Bug fixes\n\n');

  draft.android.bugs.forEach(function(bug) {
    writeStream.write(bug + "\n");
  });

  writeStream.write('\n## iOS\n\n### New features\n\n');

  draft.ios.features.forEach(function(feature) {
    writeStream.write(feature + "\n");
  });

  writeStream.write('\n### Bug fixes\n\n');

  draft.ios.bugs.forEach(function(bug) {
    writeStream.write(bug + "\n");
  });

  writeStream.write('\n## Other\n\n### New features\n\n');

  draft.other.features.forEach(function(feature) {
    writeStream.write(feature + "\n");
  });

  writeStream.write('\n### Bug fixes\n\n');

  draft.other.bugs.forEach(function(bug) {
    writeStream.write(bug + "\n");
  });

  writeStream.end();
}


/*
 1. Get last branches
 2. Request the commits list
 3. Classify
 4. Create draft
 */
lastTwoStableBranches(function(branches) {
  var apiDiffPath = '/repos/facebook/react-native/compare/' + branches[0] + '...' + branches[1];

  // get list of commits for the two compared branches
  ghApiRequest(apiDiffPath, function(res) {
    var compareUrl = res.html_url;
    var totalCommits = res.total_commits;
    var version = branches[1];
    var draft = classifyCommits(res.commits);

    createDraft(draft, compareUrl, totalCommits, version);
    console.log('Done!');
  });
});
