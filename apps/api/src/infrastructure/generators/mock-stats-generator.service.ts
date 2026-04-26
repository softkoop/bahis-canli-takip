import { Injectable } from '@nestjs/common';
import { MatchStats } from '../../domain/entities/match-stats.entity';
import { TeamStats } from '../../domain/entities/team-stats.entity';

@Injectable()
export class MockStatsGenerator {
  private filterValues = {
    totalPlay: 50,
    totalShot: 1,
    accurateShot: 1,
    dangerousAttack: 1,
    totalCorner: 1,
    duration: 1,
  };

  private random(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private randomIncrease(probability: number = 0.3): number {
    return Math.random() < probability ? 1 : 0;
  }

  // Topla oynama yüzdelerini üret (toplamı 100 olacak)
  private generatePossession(): { home: number; away: number } {
    const home = this.random(35, 65);
    const away = 100 - home;
    return { home, away };
  }

  // Takımın filtre skorunu hesapla (gol olasılığı için)
  private calculateTeamFilterScore(teamStats: TeamStats): number {
    let score = 0;
    if (teamStats.possession >= this.filterValues.totalPlay)
      score += teamStats.possession;
    if (teamStats.shots >= this.filterValues.totalShot)
      score += teamStats.shots * 10;
    if (teamStats.accurateShots >= this.filterValues.accurateShot)
      score += teamStats.accurateShots * 15;
    if (teamStats.dangerousAttacks >= this.filterValues.dangerousAttack)
      score += teamStats.dangerousAttacks;
    if (teamStats.corners >= this.filterValues.totalCorner)
      score += teamStats.corners * 5;
    return score;
  }

  // Gol olup olmayacağını belirle
  private shouldGoalHappen(
    homeStats: TeamStats,
    awayStats: TeamStats,
  ): 'home' | 'away' | null {
    const homeScore = this.calculateTeamFilterScore(homeStats);
    const awayScore = this.calculateTeamFilterScore(awayStats);
    const totalScore = homeScore + awayScore;

    if (totalScore === 0) return null;

    // %10 gol olasılığı
    if (Math.random() > 0.9) {
      const randomValue = Math.random() * totalScore;
      return randomValue < homeScore ? 'home' : 'away';
    }
    return null;
  }

  // Tek takımın istatistiklerini güncelle
  private updateSingleTeamStats(stats: TeamStats): TeamStats {
    // Yeni şut sayısı
    let newShots = stats.shots + this.randomIncrease(0.4);
    let newAccurateShots = stats.accurateShots + this.randomIncrease(0.3);

    // İsabetli şut, toplam şuttan FAZLA olamaz (eşit veya az olabilir)
    if (newAccurateShots > newShots) {
      newAccurateShots = newShots;
    }

    return new TeamStats(
      stats.possession,
      Math.min(30, newShots),
      Math.min(20, newAccurateShots),
      Math.min(60, stats.dangerousAttacks + this.randomIncrease(0.35)),
      Math.min(15, stats.corners + this.randomIncrease(0.25)),
    );
  }

  // Possession'ları dengeli şekilde güncelle
  private updatePossessions(
    currentHome: number,
    currentAway: number,
  ): { home: number; away: number } {
    const delta = this.random(-5, 5);
    let newHome = currentHome + delta;
    let newAway = currentAway - delta;

    newHome = Math.min(70, Math.max(30, newHome));
    newAway = 100 - newHome;

    return { home: newHome, away: newAway };
  }

  generateInitialMatchStats(): MatchStats {
    const possession = this.generatePossession();
    return new MatchStats(
      new TeamStats(possession.home, 0, 0, 0, 0),
      new TeamStats(possession.away, 0, 0, 0, 0),
      0,
      'first',
    );
  }

  updateMatchStats(currentStats: MatchStats): {
    newStats: MatchStats;
    goalScorer: 'home' | 'away' | null;
  } {
    const newDuration = currentStats.matchDuration + 1;
    const newHalf = newDuration > 45 ? 'second' : 'first';

    const newPossessions = this.updatePossessions(
      currentStats.home.possession,
      currentStats.away.possession,
    );

    const updatedHomeStats = this.updateSingleTeamStats(currentStats.home);
    const updatedAwayStats = this.updateSingleTeamStats(currentStats.away);

    const finalHomeStats = new TeamStats(
      newPossessions.home,
      updatedHomeStats.shots,
      updatedHomeStats.accurateShots,
      updatedHomeStats.dangerousAttacks,
      updatedHomeStats.corners,
    );

    const finalAwayStats = new TeamStats(
      newPossessions.away,
      updatedAwayStats.shots,
      updatedAwayStats.accurateShots,
      updatedAwayStats.dangerousAttacks,
      updatedAwayStats.corners,
    );

    const goalScorer = this.shouldGoalHappen(finalHomeStats, finalAwayStats);

    const newStats = new MatchStats(
      finalHomeStats,
      finalAwayStats,
      newDuration,
      newHalf,
    );

    return { newStats, goalScorer };
  }

  generateMatchStatsAtMinute(minute: number): MatchStats {
    const possession = this.generatePossession();
    const progress = minute / 90;

    // Toplam şut hesapla
    const homeTotalShots = Math.floor(this.random(0, 15) * progress);
    const awayTotalShots = Math.floor(this.random(0, 15) * progress);

    // İsabetli şut, toplam şuttan fazla olamaz
    const homeAccurateShots = Math.min(
      Math.floor(this.random(0, 10) * progress),
      homeTotalShots,
    );
    const awayAccurateShots = Math.min(
      Math.floor(this.random(0, 10) * progress),
      awayTotalShots,
    );

    return new MatchStats(
      new TeamStats(
        possession.home,
        homeTotalShots,
        homeAccurateShots,
        Math.floor(this.random(0, 50) * progress),
        Math.floor(this.random(0, 10) * progress),
      ),
      new TeamStats(
        possession.away,
        awayTotalShots,
        awayAccurateShots,
        Math.floor(this.random(0, 50) * progress),
        Math.floor(this.random(0, 10) * progress),
      ),
      minute,
      minute > 45 ? 'second' : 'first',
    );
  }

  generateScoreAtMinute(minute: number): { home: number; away: number } {
    const avgGoalsPerMatch = 2.5;
    const expectedGoals = (minute / 90) * avgGoalsPerMatch;

    let homeGoals = 0;
    let awayGoals = 0;
    const totalGoals = Math.floor(
      Math.random() * (Math.floor(expectedGoals * 2) + 1),
    );

    for (let i = 0; i < totalGoals; i++) {
      if (Math.random() > 0.5) {
        homeGoals++;
      } else {
        awayGoals++;
      }
    }

    return { home: homeGoals, away: awayGoals };
  }

  setFilters(filters: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.filterValues = { ...this.filterValues, ...filters };
  }
}
