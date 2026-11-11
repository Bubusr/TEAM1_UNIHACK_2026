import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Check in contracts directory first
    const contractsPath = path.join(process.cwd(), '..', 'contracts', 'deployed-addresses.json');
    if (fs.existsSync(contractsPath)) {
      const content = fs.readFileSync(contractsPath, 'utf-8');
      const data = JSON.parse(content);
      return NextResponse.json(data.contracts || data);
    }

    // Check inside web root as fallback
    const localPath = path.join(process.cwd(), 'deployed-addresses.json');
    if (fs.existsSync(localPath)) {
      const content = fs.readFileSync(localPath, 'utf-8');
      const data = JSON.parse(content);
      return NextResponse.json(data.contracts || data);
    }

    return NextResponse.json({
      VillageTree: null,
      GoalRegistry: null,
      MamLucVault: null,
      JourneyNFT: null,
      TramTreCheckin: null,
      status: 'not_deployed',
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to read addresses' }, { status: 500 });
  }
}

