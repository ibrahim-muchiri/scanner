export function transformStatus(status: string): string {
  let transformed = 'UNKNOWN';

  switch (status) {
    case 'NS':
      // The initial status of a game.
      transformed = 'NOT_STARTED';
      break;
    case 'LIVE':
      // The game is currently inplay.
      transformed = 'FT_LIVE';
      break;
    case 'HT':
      // The game currently is in half-time.
      transformed = 'HT_BREAK';
      break;
    case 'FT':
    case 'FT_FIN':
      // The game has ended after 90 minutes.
      transformed = 'FT_FIN';
      break;
    case 'ET':
      // The game currently is in extra time, can happen in knockout games.
      transformed = 'ET_LIVE';
      break;
    case 'PEN_LIVE':
      // Extra time didn't get a winner, penalties are taken to determine the winner.
      transformed = 'PEN_LIVE';
      break;
    case 'AET':
      // The game has finished after 120 minutes.
      transformed = 'ET_FIN';
      break;
    case 'BREAK':
      // Waiting for extra time or penalties to start.
      transformed = 'MISC_BREAK';
      break;
    case 'FT_PEN':
      // Finished after penalty shootout.
      transformed = 'PEN_FIN';
      break;
    case 'CANCL':
      // The game has been cancelled.
      transformed = 'CANCELED';
      break;
    case 'POSTP':
      // The game has been postponed.
      transformed = 'POSTPONED';
      break;
    case 'INT':
      // The game has been interrupted. Can be due to bad weather.
      transformed = 'INTERRUPTED';
      break;
    case 'ABAN':
      // The game has abandoned and will continue at a later time or day.
      transformed = 'ABANDONED';
      break;
    case 'SUSP':
      // The game has suspended and will continue at a later time or day.
      transformed = 'SUSPENDED';
      break;
    case 'AWARDED':
      // Winner is beeing decided externally.
      transformed = 'AWARDED';
      break;
    case 'DELAYED':
      // The game is delayed so it wil start later.
      transformed = 'DELAYED';
      break;
    case 'TBA':
      // Fixture will be updated with exact time later.
      transformed = 'TBA';
      break;
    case 'WO':
      // Awarding of a victory to a contestant because there are no other contestants.
      transformed = 'WALKOVERD';
      break;
    case 'AU':
      // Can occur when there is a connectivity issue or something.
      transformed = 'WAITING';
      break;
    case 'Deleted':
      // Game is not available anymore via normal api calls because it has been replaced.
      // This can happen in leagues that have a lot of changes in their schedules.
      // The games can still be retrieved by adding deleted=1 to your request so you can update your system properly..
      transformed = 'DELETED';
      break;
    default:
      throw new Error('Status key not found: ' + status);
  }

  return transformed;
}

export function transformStatusDetail(statusDetail: string) {
  switch (statusDetail) {
    case 'NOT_STARTED':
      return 'NOT_FIN';
    case 'FT_LIVE':
      return 'IN_PLAY';
    case 'HT_BREAK':
      return 'IN_PLAY';
    case 'FT_FIN':
      return 'FIN';
    case 'ET_LIVE':
      return 'IN_PLAY';
    case 'PEN_LIVE':
      return 'IN_PLAY';
    case 'ET_FIN':
      return 'FIN';
    case 'MISC_BREAK':
      return 'IN_PLAY';
    case 'PEN_FIN':
      return 'FIN';
    case 'CANCELED':
      return 'NOT_FIN';
    case 'POSTPONED':
      return 'NOT_FIN';
    case 'INTERRUPTED':
      return 'IN_PLAY';
    case 'ABANDONED':
      return 'NOT_FIN';
    case 'SUSPENDED':
      return 'NOT_FIN';
    case 'AWARDED':
      return 'FIN';
    case 'DELAYED':
      return 'NOT_FIN';
    case 'TBA':
      return 'NOT_FIN';
    case 'WALKOVERD':
      return 'FIN';
    case 'WAITING':
      return 'UNKNOWN';
    case 'DELETED':
      return 'DELETED';
  }
}

export function transformStatusComplete(status) {
  // console.log(transformStatusDetail(transformStatus(status)));
  return transformStatusDetail(transformStatus(status));
}

export function transformStageType(type: string): string {
  // let transformed = 'UNKNOWN';
  let transformed = 'KNOCK_OUT'; // Todo: Real fix by adding to app_public.stage_type in DB

  switch (type) {
    case 'Knock Out':
      transformed = 'KNOCK_OUT';
      break;
    case 'Group Stage':
      transformed = 'GROUP';
      break;
    case 'Qualifying':
      transformed = 'QUALIFYING';
      break;
  }

  return transformed;
}

export function transformLeagueType(type: string): string {
  let transformed = 'UNKNOWN';

  switch (type) {
    case 'cup_international':
      transformed = 'INTERNATIONAL_CUP';
      break;
    default:
      transformed = type.toUpperCase();
  }

  return transformed;
}

export function extractHome(result: string): number | null {
  const found = /^(\d+)-(\d+)$/.exec(result);
  if (found && found[1]) {
    return Number(found[1]);
  }
  return null;
}

export function extractAway(result: string): number | null {
  const found = /^(\d+)-(\d+)$/.exec(result);
  if (found && found[2]) {
    return Number(found[2]);
  }
  return null;
}
