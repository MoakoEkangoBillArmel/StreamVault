import { VideoResolver, NormalizedStream } from '@streaming/shared';

export class TestDemoProvider implements VideoResolver {
  public async resolve(episodeIdentifier: string, language: string): Promise<NormalizedStream[]> {
    // Simulons un délai réseau
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Pour les tests, on renvoie un stream de démonstration (Big Buck Bunny - domaine public)
    return [
      {
        url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        type: 'hls',
        quality: '1080p',
        language: language as 'VF' | 'VOSTFR' | 'RAW',
        server: 'TEST_ONLY_SERVER',
        provider: 'test_demo_provider',
        publicHeaders: {
          'Origin': 'https://localhost',
        }
      }
    ];
  }
}
