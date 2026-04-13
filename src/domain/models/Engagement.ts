export interface Engagement {
  id: string;
  personId: string | null;
  erbjudandeNamn: string | null;
  forstaHamtning: string | null;
  senasteHamtning: string | null;
  totaltAntalHamtningar: number;
  normaliseradEpost: string | null;
  engagemangNyckel: string | null;
}
