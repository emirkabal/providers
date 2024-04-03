export interface InfoResult {
  title: string;
  seasons: {
    id: number;
    position: number;
  }[];
}

export interface SeasonResult {
  data: {
    id: number;
    position: number;
    episodes: {
      id: number;
      video_id: string;
      meta: {
        position: number;
      };
    }[];
  };
}

export interface VideoResult {
  data: {
    flavors: {
      hls: string;
    };
  };
  success: boolean;
}

export interface ResultItem {
  id: number;
  name: string;
}

export interface SearchResult {
  data: {
    title_category: string;
    data: ResultItem[];
  }[];
}
