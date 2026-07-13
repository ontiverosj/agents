// Provider interface (duck-typed):
//   name: 'mock' | 'apify'
//   fetchVideosByHashtag(tag, {limit}) -> Promise<RawVideo[]>
//   fetchTrendingByKeyword(query, {limit}) -> Promise<RawVideo[]>
// RawVideo: { externalId, url, authorHandle, authorFollowers, caption,
//             hashtags, durationSeconds, postedAt, stats: {views, likes, comments, shares, saves} }

const config = require('../config');
const mockProvider = require('./mockProvider');
const apifyProvider = require('./apifyProvider');

const provider = config.apifyToken ? apifyProvider : mockProvider;

module.exports = provider;
