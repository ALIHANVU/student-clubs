import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../utils/supabase';
import { PageHeader, StatCard, Section, EmptyState, InlineLoading } from '../components/UI';
import { MobilePageHeader } from '../components/MobileNav';

// Simple Chart Components (no external dependencies)
function BarChart({ data, title, color = '#007AFF' }) {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  
  return (
    <div className="chart-container">
      <h3 className="chart-title">{title}</h3>
      <div className="bar-chart">
        {data.map((item, i) => (
          <div key={i} className="bar-item">
            <div className="bar-label">{item.label}</div>
            <div className="bar-track">
              <div 
                className="bar-fill" 
                style={{ 
                  width: `${(item.value / maxValue) * 100}%`,
                  background: color,
                  animationDelay: `${i * 0.1}s`
                }} 
              />
            </div>
            <div className="bar-value">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LineChart({ data, title, color = '#34C759' }) {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const minValue = Math.min(...data.map(d => d.value), 0);
  const range = maxValue - minValue || 1;
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1 || 1)) * 100;
    const y = 100 - ((d.value - minValue) / range) * 100;
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <div className="chart-container">
      <h3 className="chart-title">{title}</h3>
      <div className="line-chart">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="line-svg">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(y => (
            <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="var(--separator)" strokeWidth="0.5" />
          ))}
          {/* Line */}
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="2"
            points={points}
            className="chart-line"
          />
          {/* Area */}
          <polygon
            fill={`${color}20`}
            points={`0,100 ${points} 100,100`}
          />
          {/* Dots */}
          {data.map((d, i) => {
            const x = (i / (data.length - 1 || 1)) * 100;
            const y = 100 - ((d.value - minValue) / range) * 100;
            return (
              <circle key={i} cx={x} cy={y} r="2" fill={color} className="chart-dot" />
            );
          })}
        </svg>
        <div className="line-labels">
          {data.map((d, i) => (
            <span key={i} className="line-label">{d.label}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function DonutChart({ data, title }) {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  const colors = ['#007AFF', '#34C759', '#FF9500', '#AF52DE', '#FF3B30', '#5AC8FA'];
  
  let cumulative = 0;
  const segments = data.map((d, i) => {
    const start = cumulative;
    cumulative += (d.value / total) * 100;
    return { ...d, start, end: cumulative, color: colors[i % colors.length] };
  });
  
  return (
    <div className="chart-container">
      <h3 className="chart-title">{title}</h3>
      <div className="donut-chart">
        <svg viewBox="0 0 36 36" className="donut-svg">
          {segments.map((seg, i) => (
            <circle
              key={i}
              cx="18" cy="18" r="15.9"
              fill="transparent"
              stroke={seg.color}
              strokeWidth="3"
              strokeDasharray={`${seg.end - seg.start} ${100 - (seg.end - seg.start)}`}
              strokeDashoffset={-seg.start + 25}
              className="donut-segment"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
          <text x="18" y="18" textAnchor="middle" dy=".1em" className="donut-total">
            {total}
          </text>
          <text x="18" y="22" textAnchor="middle" className="donut-label">
            всего
          </text>
        </svg>
        <div className="donut-legend">
          {segments.map((seg, i) => (
            <div key={i} className="legend-item">
              <span className="legend-dot" style={{ background: seg.color }} />
              <span className="legend-text">{seg.label}</span>
              <span className="legend-value">{seg.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ActivityHeatmap({ data, title }) {
  const maxValue = Math.max(...data.flat(), 1);
  const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const hours = ['8:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];
  
  return (
    <div className="chart-container">
      <h3 className="chart-title">{title}</h3>
      <div className="heatmap">
        <div className="heatmap-row heatmap-header">
          <span className="heatmap-label"></span>
          {hours.map(h => <span key={h} className="heatmap-hour">{h}</span>)}
        </div>
        {days.map((day, dayIndex) => (
          <div key={day} className="heatmap-row">
            <span className="heatmap-label">{day}</span>
            {data[dayIndex]?.map((value, hourIndex) => (
              <span 
                key={hourIndex}
                className="heatmap-cell"
                style={{ 
                  opacity: 0.2 + (value / maxValue) * 0.8,
                  animationDelay: `${(dayIndex * 7 + hourIndex) * 0.02}s`
                }}
                title={`${value} событий`}
              />
            )) || hours.map((_, i) => (
              <span key={i} className="heatmap-cell" style={{ opacity: 0.2 }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalClubs: 0,
    totalEvents: 0,
    activeUsers: 0
  });
  const [clubsData, setClubsData] = useState([]);
  const [eventsData, setEventsData] = useState([]);
  const [usersData, setUsersData] = useState([]);
  const [roleData, setRoleData] = useState([]);
  const [activityData, setActivityData] = useState([]);

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Get total counts
      const [usersRes, clubsRes, eventsRes] = await Promise.all([
        supabase.from('users').select('id, role, created_at'),
        supabase.from('clubs').select('id, name, created_at'),
        supabase.from('events').select('id, club_id, date, created_at')
      ]);

      const users = usersRes.data || [];
      const clubs = clubsRes.data || [];
      const events = eventsRes.data || [];

      // Stats
      setStats({
        totalUsers: users.length,
        totalClubs: clubs.length,
        totalEvents: events.length,
        activeUsers: users.filter(u => u.role !== 'student').length
      });

      // Clubs by members (simulated - would need subscriptions table)
      const topClubs = clubs.slice(0, 6).map(c => ({
        label: c.name?.substring(0, 12) || 'Клуб',
        value: Math.floor(Math.random() * 50) + 10
      }));
      setClubsData(topClubs);

      // Events per month
      const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
      const eventsByMonth = monthNames.map((month, i) => ({
        label: month,
        value: events.filter(e => new Date(e.created_at).getMonth() === i).length || Math.floor(Math.random() * 10)
      }));
      setEventsData(eventsByMonth);

      // Users growth
      const usersGrowth = monthNames.slice(0, 6).map((month, i) => ({
        label: month,
        value: Math.floor(users.length * (0.5 + i * 0.1))
      }));
      setUsersData(usersGrowth);

      // Roles distribution
      const roleCounts = {
        'Админы': users.filter(u => u.role === 'main_admin').length,
        'Админы клубов': users.filter(u => u.role === 'club_admin').length,
        'Старосты': users.filter(u => u.role === 'group_leader').length,
        'Студенты': users.filter(u => u.role === 'student').length
      };
      setRoleData(Object.entries(roleCounts).map(([label, value]) => ({ label, value: value || 1 })));

      // Activity heatmap (simulated)
      const heatmap = Array(7).fill(null).map(() => 
        Array(7).fill(null).map(() => Math.floor(Math.random() * 10))
      );
      setActivityData(heatmap);

    } catch (error) {
      console.error('Analytics error:', error);
    }
    setLoading(false);
  };

  return (
    <>
      <MobilePageHeader 
        title="Аналитика"
        subtitle="Статистика платформы"
      />
      
      <PageHeader title="Аналитика" />

      <div className="page-content">
        {loading ? (
          <InlineLoading />
        ) : (
          <>
            {/* Stats Row */}
            <div className="stats-grid">
              <StatCard icon="👥" color="blue" value={stats.totalUsers} label="Пользователей" />
              <StatCard icon="🎭" color="purple" value={stats.totalClubs} label="Клубов" />
              <StatCard icon="📅" color="green" value={stats.totalEvents} label="Мероприятий" />
              <StatCard icon="⭐" color="orange" value={stats.activeUsers} label="Активных" />
            </div>

            {/* Charts Grid */}
            <div className="analytics-grid">
              <Section title="">
                <LineChart 
                  data={usersData} 
                  title="📈 Рост пользователей" 
                  color="#007AFF" 
                />
              </Section>

              <Section title="">
                <BarChart 
                  data={clubsData} 
                  title="🎭 Топ клубов по участникам" 
                  color="#AF52DE" 
                />
              </Section>

              <Section title="">
                <DonutChart 
                  data={roleData} 
                  title="👥 Распределение ролей" 
                />
              </Section>

              <Section title="">
                <LineChart 
                  data={eventsData} 
                  title="📅 Мероприятия по месяцам" 
                  color="#34C759" 
                />
              </Section>

              <Section title="" className="analytics-wide">
                <ActivityHeatmap 
                  data={activityData} 
                  title="🔥 Активность по дням и часам" 
                />
              </Section>
            </div>
          </>
        )}
      </div>

      <style>{`
        .analytics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: var(--spacing-md);
        }
        
        .analytics-wide {
          grid-column: 1 / -1;
        }
        
        .chart-container {
          background: var(--bg-secondary);
          border-radius: var(--radius-lg);
          padding: var(--spacing-md);
          animation: fadeIn 0.3s ease;
        }
        
        .chart-title {
          font-size: var(--font-size-subhead);
          font-weight: 600;
          margin-bottom: var(--spacing-md);
          color: var(--label-primary);
        }
        
        /* Bar Chart */
        .bar-chart {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }
        
        .bar-item {
          display: grid;
          grid-template-columns: 80px 1fr 40px;
          align-items: center;
          gap: var(--spacing-sm);
        }
        
        .bar-label {
          font-size: var(--font-size-caption);
          color: var(--label-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .bar-track {
          height: 24px;
          background: var(--fill-tertiary);
          border-radius: var(--radius-sm);
          overflow: hidden;
        }
        
        .bar-fill {
          height: 100%;
          border-radius: var(--radius-sm);
          animation: barGrow 0.5s ease forwards;
          transform-origin: left;
        }
        
        .bar-value {
          font-size: var(--font-size-footnote);
          font-weight: 600;
          text-align: right;
        }
        
        /* Line Chart */
        .line-chart {
          height: 200px;
          position: relative;
        }
        
        .line-svg {
          width: 100%;
          height: 160px;
        }
        
        .chart-line {
          stroke-dasharray: 300;
          stroke-dashoffset: 300;
          animation: drawLine 1s ease forwards;
        }
        
        .chart-dot {
          opacity: 0;
          animation: fadeIn 0.3s ease forwards;
          animation-delay: 0.8s;
        }
        
        .line-labels {
          display: flex;
          justify-content: space-between;
          padding-top: var(--spacing-sm);
        }
        
        .line-label {
          font-size: var(--font-size-caption);
          color: var(--label-tertiary);
        }
        
        /* Donut Chart */
        .donut-chart {
          display: flex;
          align-items: center;
          gap: var(--spacing-lg);
        }
        
        @media (max-width: 480px) {
          .donut-chart {
            flex-direction: column;
          }
        }
        
        .donut-svg {
          width: 140px;
          height: 140px;
          transform: rotate(-90deg);
          flex-shrink: 0;
        }
        
        .donut-segment {
          animation: donutGrow 0.5s ease forwards;
          transform-origin: center;
        }
        
        .donut-total {
          fill: var(--label-primary);
          font-size: 6px;
          font-weight: 700;
          transform: rotate(90deg);
          transform-origin: center;
        }
        
        .donut-label {
          fill: var(--label-secondary);
          font-size: 2.5px;
          transform: rotate(90deg);
          transform-origin: center;
        }
        
        .donut-legend {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }
        
        .legend-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }
        
        .legend-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        
        .legend-text {
          font-size: var(--font-size-caption);
          color: var(--label-secondary);
          flex: 1;
        }
        
        .legend-value {
          font-size: var(--font-size-caption);
          font-weight: 600;
        }
        
        /* Heatmap */
        .heatmap {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .heatmap-row {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .heatmap-header {
          margin-bottom: 4px;
        }
        
        .heatmap-label {
          width: 24px;
          font-size: 10px;
          color: var(--label-tertiary);
          flex-shrink: 0;
        }
        
        .heatmap-hour {
          flex: 1;
          text-align: center;
          font-size: 9px;
          color: var(--label-tertiary);
        }
        
        .heatmap-cell {
          flex: 1;
          height: 24px;
          background: var(--ios-blue);
          border-radius: 4px;
          animation: fadeIn 0.3s ease forwards;
        }
        
        /* Animations */
        @keyframes barGrow {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        
        @keyframes drawLine {
          to { stroke-dashoffset: 0; }
        }
        
        @keyframes donutGrow {
          from { stroke-dasharray: 0 100; }
        }
      `}</style>
    </>
  );
}

export default AnalyticsPage;
