import { MovieMedia, ShowMedia } from '@/entrypoint/utils/media';
import { compareMedia } from '@/utils/compare';
import { ScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

import { InfoResult, ResultItem, SearchResult, SeasonResult, VideoResult } from './types';

export const baseUrl = atob('aHR0cHM6Ly9hcHBzZXJ2aWNlLnB1aHV0di5jb20=');
export const mediaUrl = atob('aHR0cHM6Ly9keWd2aWRlby5keWdkaWdpdGFsLmNvbS9hcGkvdmlkZW9faW5mbw==');
export const secretKey = atob('TnR2QXBpU2VjcmV0MjAxNCo=');

export async function searchAndFindMedia(
  ctx: ScrapeContext,
  media: MovieMedia | ShowMedia,
): Promise<ResultItem | undefined> {
  if (media.type === 'movie') return undefined;

  const searchRes = await ctx.fetcher<SearchResult>(`/search/search`, {
    baseUrl,
    query: { query: media.originalTitle || media.title, v: '2' },
  });

  const results = searchRes.data.find((res) => res.title_category === 'Diziler')?.data;
  if (!results) return undefined;

  ctx.progress(30);

  if (media.originalTitle) media.originalTitle = media.originalTitle.split(':')[0];

  const result = results.find((res: ResultItem) => compareMedia(media, res.name, undefined, true));
  return result;
}

async function getVideo(ctx: ScrapeContext, id: string) {
  ctx.progress(90);

  const video = await ctx.fetcher<VideoResult>(mediaUrl, {
    query: {
      akamai: 'true',
      PublisherId: '29',
      ReferenceId: id,
      SecretKey: secretKey,
    },
  });

  if (!video?.success) throw new NotFoundError('Not found');

  return {
    playlist: video.data.flavors.hls,
    captions: [],
  };
}

export async function scrape(ctx: ScrapeContext, media: MovieMedia | ShowMedia, result: ResultItem) {
  if (media.type === 'movie') throw new NotFoundError('Not found');

  const info = await ctx.fetcher<InfoResult[]>(`/service/serie/getSerieInformations`, {
    baseUrl,
    query: {
      id: result.id.toString(),
    },
  });

  const season = info?.[0].seasons.find((v) => v.position === Number(media.season.number));
  if (!season) throw new NotFoundError('Not found');

  ctx.progress(45);

  const episodes = await ctx.fetcher<SeasonResult>(`/api/seasons/${season.id}/episodes`, {
    baseUrl,
    query: {
      v: '2',
    },
  });

  if (!episodes?.data?.episodes) throw new NotFoundError('Not found');

  if (season.position !== 1) {
    episodes.data.episodes.sort((a, b) => a.meta.position - b.meta.position);
    episodes.data.episodes = episodes.data.episodes.map((e, i) => {
      e.meta.position = i + 1;
      return e;
    });
  }

  const episode = episodes.data.episodes.find((v) => v.meta.position === Number(media.episode.number));
  if (!episode) throw new NotFoundError('Not found');

  ctx.progress(75);

  const video = await getVideo(ctx, episode.video_id);
  return video;
}
