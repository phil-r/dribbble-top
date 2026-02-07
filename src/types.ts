export interface ShotAuthor {
  name: string;
  url: string;
}

export interface Shot {
  id: number;
  img: string;
  video: string | null;
  url: string;
  likes: number;
  comments: number;
  viewsString: string;
  title: string;
  author: ShotAuthor;
}

export interface RawShot {
  id?: string | number | null | undefined;
  img?: string | null | undefined;
  video?: string | null | undefined;
  url?: string | null | undefined;
  likes?: string | number | null | undefined;
  comments?: string | number | null | undefined;
  viewsString?: string | null | undefined;
  title?: string | null | undefined;
  author?: {
    name?: string | null | undefined;
    url?: string | null | undefined;
  } | null | undefined;
}

export interface TopSuccessResponse {
  ok: true;
  top: Shot[];
}

export interface TopErrorResponse {
  ok: false;
  error: string;
}

export type TopResponse = TopSuccessResponse | TopErrorResponse;
