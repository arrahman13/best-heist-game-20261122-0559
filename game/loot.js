// loot.js — the loot: small pickups worth more deeper in the room, and the
// vault itself. Grabbing the vault starts the getaway timer.
import { LOOT_SPOTS, VAULT } from './level.js';

export class LootItem {
  constructor(x, y, value, label, kind = 'cash') {
    this.x = x; this.y = y;
    this.value = value; this.label = label;
    this.kind = kind;
    this.taken = false;
    this.bob = Math.random() * 6;
  }

  update(dt) { this.bob += dt; }

  draw(ctx) {
    if (this.taken) return;
    const bobY = Math.sin(this.bob * 2.4) * 2;
    if (this.kind === 'vault') {
      // Big gold vault: safe door with a glowing dial.
      ctx.save();
      ctx.translate(this.x, this.y + bobY * 0.3);
      ctx.fillStyle = '#8a6d1f';
      ctx.fillRect(-26, -26, 52, 52);
      ctx.fillStyle = '#e8c15a';
      ctx.fillRect(-22, -22, 44, 44);
      ctx.strokeStyle = '#fff2b0';
      ctx.lineWidth = 2;
      ctx.strokeRect(-22, -22, 44, 44);
      ctx.fillStyle = '#5a4510';
      ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fff2b0';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(7, -7); ctx.stroke();
      ctx.restore();
      ctx.fillStyle = '#ffe98a';
      ctx.font = 'bold 12px Verdana, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(VAULT.label, this.x, this.y - 34);
      // Pulsing gold ring so the target is obvious.
      ctx.strokeStyle = `rgba(255,220,90,${0.35 + 0.25 * Math.sin(this.bob * 3)})`;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(this.x, this.y, 34, 0, Math.PI * 2); ctx.stroke();
    } else {
      // Cash stack: green-gold bundle with a "$" tag.
      ctx.save();
      ctx.translate(this.x, this.y + bobY);
      ctx.fillStyle = '#2e7d46';
      ctx.fillRect(-11, -7, 22, 14);
      ctx.fillStyle = '#57c785';
      ctx.fillRect(-11, -7, 22, 5);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px Verdana, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('$', 0, 5);
      ctx.restore();
      ctx.fillStyle = '#ffe98a';
      ctx.font = 'bold 11px Verdana, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.label, this.x, this.y - 16);
    }
  }
}

export function createLoot() {
  const items = LOOT_SPOTS.map((s) => new LootItem(s.x, s.y, s.value, s.label, 'cash'));
  items.push(new LootItem(VAULT.x, VAULT.y, VAULT.value, VAULT.label, 'vault'));
  return items;
}
