import { useExpeditionStore } from '../store';
import { motion } from 'motion/react';
import { Vault, Coins, TrendingUp, ShieldCheck, Gift, ExternalLink, Award } from 'lucide-react';
import { Card, Button, Progress } from '../ui';
import { useState } from 'react';

export function Treasury() {
  const karbovanets = useExpeditionStore((s) => s.karbovanets);
  const reputation = useExpeditionStore((s) => s.reputation);
  const historicalPrestige = useExpeditionStore((s) => s.historicalPrestige);
  const spendKarbovanets = useExpeditionStore((s) => s.spendKarbovanets);
  const addKarbovanets = useExpeditionStore((s) => s.addKarbovanets);
  const pushToast = useExpeditionStore((s) => s.pushToast);

  const [premium, setPremium] = useState(false);
  const bondValue = Math.floor(karbovanets * 0.15);

  const buyBond = () => {
    if (bondValue < 100) {
      pushToast('Недостатньо карбованців для облігації', '#FF2A5F');
      return;
    }
    if (spendKarbovanets(bondValue)) {
      const payout = Math.round(bondValue * 1.12);
      setTimeout(() => {
        addKarbovanets(payout);
        pushToast(`Облігація погашена: +${payout} карб.`, '#00E5FF');
      }, 4000);
      pushToast(`Облігацію придбано на ${bondValue} карб. (дохід 12%)`, '#00E5FF');
    }
  };

  const activatePremium = () => {
    if (premium) return;
    if (spendKarbovanets(5000)) {
      setPremium(true);
      pushToast('Преміум активовано!', '#9747FF');
    } else {
      pushToast('Потрібно 5000 карбованців', '#FF2A5F');
    }
  };

  return (
    <div className="min-h-full bg-[#0D1117] p-4 pb-20">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FFC72C20', border: '1px solid #FFC72C' }}>
            <Vault className="w-6 h-6" style={{ color: '#FFC72C' }} />
          </div>
          <div>
            <h1 className="text-xl" style={{ fontFamily: "'Exo 2', sans-serif" }}>Скарбниця академії</h1>
            <p className="text-xs text-muted-foreground">Фінанси та нагороди</p>
          </div>
        </div>

        <Card className="bg-gradient-to-br from-[#FFC72C]/20 to-[#FF2A5F]/20 border-2 p-4 mb-4" style={{ borderColor: '#FFC72C' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5" style={{ color: '#FFC72C' }} />
              <span className="text-sm text-muted-foreground">Резерви карбованців</span>
            </div>
            <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ repeat: Infinity, duration: 3 }}>
              <Coins className="w-6 h-6" style={{ color: '#FFC72C' }} />
            </motion.div>
          </div>
          <div className="text-4xl mb-2" style={{ fontFamily: "'Exo 2', sans-serif", color: '#FFC72C' }}>{Math.round(karbovanets).toLocaleString()}</div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" style={{ color: '#00E5FF' }} />
            <span className="text-sm" style={{ color: '#00E5FF' }}>Пасивний дохід з музею активний</span>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Card className="border-white/10 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Award className="w-4 h-4" style={{ color: '#9747FF' }} />
              <span className="text-xs text-muted-foreground">Престиж</span>
            </div>
            <div className="text-xl" style={{ fontFamily: "'Exo 2', sans-serif", color: '#9747FF' }}>{Math.round(historicalPrestige).toLocaleString()}</div>
          </Card>
          <Card className="border-white/10 p-3">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-4 h-4" style={{ color: '#FF2A5F' }} />
              <span className="text-xs text-muted-foreground">Репутація</span>
            </div>
            <div className="text-xl" style={{ fontFamily: "'Exo 2', sans-serif", color: '#FF2A5F' }}>{Math.round(reputation).toLocaleString()}</div>
          </Card>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-lg mb-3" style={{ fontFamily: "'Exo 2', sans-serif" }}>Історичні облігації</h2>
        <Card className="border-white/10 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#00E5FF20' }}>
              <Gift className="w-5 h-5" style={{ color: '#00E5FF' }} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm mb-1" style={{ fontFamily: "'Exo 2', sans-serif" }}>Фонд національної спадщини</h3>
              <p className="text-xs text-muted-foreground">Доступна інвестиційна можливість</p>
            </div>
          </div>
          <div className="bg-[#0D1117] rounded p-3 mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Номінал облігації</span>
              <span className="text-sm" style={{ fontFamily: "'Exo 2', sans-serif", color: '#00E5FF' }}>{bondValue.toLocaleString()} карб.</span>
            </div>
            <Progress value={75} className="h-1.5 mb-2" />
            <p className="text-xs text-muted-foreground">Погашення: 4с · Річний дохід: 12%</p>
          </div>
          <Button className="w-full" onClick={buyBond} style={{ backgroundColor: '#00E5FF', color: '#0D1117', fontFamily: "'Exo 2', sans-serif" }}>
            Придбати облігацію
          </Button>
        </Card>
      </div>

      <div className="mb-6">
        <h2 className="text-lg mb-3" style={{ fontFamily: "'Exo 2', sans-serif" }}>Преміум-акаунт</h2>
        <Card className="bg-gradient-to-br from-[#9747FF]/20 to-[#FF2A5F]/20 border-2 p-4" style={{ borderColor: premium ? '#00E5FF' : '#9747FF' }}>
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-5 h-5" style={{ color: premium ? '#00E5FF' : '#9747FF' }} />
            <h3 className="text-sm" style={{ fontFamily: "'Exo 2', sans-serif", color: premium ? '#00E5FF' : undefined }}>
              {premium ? 'Преміум активний' : 'Покращити до преміум'}
            </h3>
          </div>
          <div className="space-y-2 mb-4">
            {[
              { c: '#FFC72C', t: '+25% дохід карбованців' },
              { c: '#00E5FF', t: '+15% шанс успіху експедицій' },
              { c: '#9747FF', t: '-30% час реставрації' },
              { c: '#FF2A5F', t: 'Ексклюзивні легендарні артефакти' },
            ].map((b) => (
              <div key={b.t} className="flex items-center gap-2 text-xs">
                <div className="w-1 h-1 rounded-full" style={{ backgroundColor: b.c }} />
                <span className="text-muted-foreground">{b.t}</span>
              </div>
            ))}
          </div>
          {!premium && (
            <Button className="w-full" onClick={activatePremium} style={{ backgroundColor: '#9747FF', color: '#fff', fontFamily: "'Exo 2', sans-serif" }}>
              Активувати за 5000 карб.
            </Button>
          )}
        </Card>
      </div>

      <Card className="border-white/10 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FFC72C20' }}>
            <ExternalLink className="w-5 h-5" style={{ color: '#FFC72C' }} />
          </div>
          <div className="flex-1">
            <h3 className="text-sm mb-1" style={{ fontFamily: "'Exo 2', sans-serif" }}>Обмін нагород</h3>
            <p className="text-xs text-muted-foreground">{Math.floor(karbovanets / 100)} ваучерів доступно</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Скарбниця академії — система фінансування історичних досліджень. Усі операції підтримують освітні ініціативи та збереження культурної спадщини.
        </p>
      </Card>
    </div>
  );
}
