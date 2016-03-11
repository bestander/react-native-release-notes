react-native-release-notes
===

*This is just a quick and experimental* ***hack***.

## About

I hacked it together after creating release notes for React Native manually a few times.

The idea is that we could have script which will generate the release notes whenever we make a new release.
For now this can be used as a script to generate a draft for release notes.

### How it works

1. Gets list of branches from react-native, and picks up the last two *stable* ones.
2. Uses the above to create a URL with which we can get a list of commits from those compared branches.
3. Looks through the list of commits messages and does *very* basic classification.
4. Generates a `draft.md` file with the draft of release notes.

### TODO

- better classification, maybe check the files which are being changed 
and based on that clasify if it's core, ios, or android change


## Get started

1. `node main.js`


## Contribute

This is just a hack so it can be done in a better way. Feel free to send PRs.
