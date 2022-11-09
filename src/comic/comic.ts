import { HydrusFileFromAPI } from 'src/hydrus-file';

export interface ComicPageIndentifier {
  volume?: string;
  chapter?: string;
  page: string;
}

export interface ComicPage extends HydrusFileFromAPI, ComicPageIndentifier {
}

export interface Comic {
  title: string;
  pages: ComicPage[];
}
