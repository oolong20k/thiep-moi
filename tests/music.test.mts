import { test } from 'node:test';
import assert from 'node:assert/strict';
import { youtubeId } from '../lib/music.ts';

test('YouTube watch, short and embed URLs use the same video; audio and foreign hosts do not', () => {
  for (const url of ['https://www.youtube.com/watch?v=sctrgmZ_JNM&list=RDsctrgmZ_JNM&start_radio=1', 'https://youtu.be/sctrgmZ_JNM', 'https://www.youtube.com/embed/sctrgmZ_JNM', 'https://music.youtube.com/watch?v=sctrgmZ_JNM&si=share']) {
    assert.equal(youtubeId(url), 'sctrgmZ_JNM');
  }
  for (const url of ['', 'https://example.com/song.mp3', 'https://youtube.com.evil.test/watch?v=sctrgmZ_JNM', 'https://youtube.com/watch?v=bad', 'https://music.youtube.com.evil.test/watch?v=J9abt3xpdDU']) assert.equal(youtubeId(url), null);
});

test('YouTube Music shares are video sources, never direct audio files', () => {
  assert.equal(youtubeId('https://music.youtube.com/watch?v=J9abt3xpdDU&si=9qKDxROan8b2T-wf'), 'J9abt3xpdDU');
});
