import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

import { scrape, searchAndFindMedia } from './util';

async function universalScraper(ctx: MovieScrapeContext | ShowScrapeContext): Promise<SourcererOutput> {
  const puhuData = await searchAndFindMedia(ctx, ctx.media);
  if (!puhuData) throw new NotFoundError('Media not found');

  const video = await scrape(ctx, ctx.media, puhuData);
  if (!video.playlist) throw new NotFoundError('No video found');

  return {
    embeds: [],
    stream: [
      {
        id: 'primary',
        playlist: video.playlist,
        type: 'hls',
        flags: [flags.CORS_ALLOWED],
        captions: [],
      },
    ],
  };
}

export const puhuScraper = makeSourcerer({
  id: 'puhu',
  name: 'puhu',
  rank: 300,
  flags: [flags.CORS_ALLOWED],
  scrapeShow: universalScraper,
  scrapeMovie: universalScraper,
});
