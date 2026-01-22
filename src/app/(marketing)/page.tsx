'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Video,
  Image,
  Music,
  Wand2,
  Sparkles,
  Film,
  Layers,
  Subtitles,
  LayoutTemplate,
  Scissors,
  Play,
  CheckCircle2,
  ArrowRight,
  Zap,
  Shield,
  Clock,
} from 'lucide-react';

const features = [
  {
    name: 'Text to Video',
    description: 'Transform your ideas into stunning videos with Sora 2 and Veo 3',
    icon: Video,
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    name: 'Image to Video',
    description: 'Bring your photos to life with AI-powered animation',
    icon: Film,
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    name: 'Text to Image',
    description: 'Generate beautiful images from text descriptions',
    icon: Image,
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    name: 'Text to Music',
    description: 'Create original music with AI-generated vocals',
    icon: Music,
    gradient: 'from-orange-500 to-yellow-500',
  },
  {
    name: 'Video Extension',
    description: 'Extend your videos seamlessly with Veo Extend',
    icon: Layers,
    gradient: 'from-red-500 to-orange-500',
  },
  {
    name: 'Storyboard',
    description: 'Create multi-scene videos with custom prompts',
    icon: LayoutTemplate,
    gradient: 'from-indigo-500 to-purple-500',
  },
  {
    name: 'Image Remix',
    description: 'Combine and transform multiple images with AI',
    icon: Wand2,
    gradient: 'from-pink-500 to-rose-500',
  },
  {
    name: 'Free Subtitles',
    description: 'Add AI-generated subtitles to any video for free',
    icon: Subtitles,
    gradient: 'from-teal-500 to-green-500',
  },
  {
    name: '50+ Templates',
    description: 'Quick creation with pre-designed fun templates',
    icon: Scissors,
    gradient: 'from-violet-500 to-purple-500',
  },
];

const pricingTiers = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for trying out Klipx',
    features: [
      '60 free credits on signup',
      '3 generations per day',
      'All AI models',
      'Watermarked videos',
      'Community support',
    ],
    cta: 'Get Started Free',
    href: '/signup/',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$19.99',
    period: '/week',
    description: 'Best for regular creators',
    features: [
      '500 credits per week',
      '25 generations per day',
      'All AI models',
      'No watermarks',
      '+20% bonus on credit packs',
      'Priority queue',
      'Priority support',
    ],
    cta: 'Start Pro Trial',
    href: '/signup/?plan=pro',
    highlighted: true,
  },
  {
    name: 'Elite',
    price: '$39.99',
    period: '/week',
    description: 'For power users & teams',
    features: [
      '1500 credits per week',
      'Unlimited generations',
      'All AI models',
      'No watermarks',
      '+35% bonus on credit packs',
      'Highest priority queue',
      'Dedicated support',
      'Early access to new features',
    ],
    cta: 'Go Elite',
    href: '/signup/?plan=elite',
    highlighted: false,
  },
];

const stats = [
  { value: '1M+', label: 'Videos Created' },
  { value: '100K+', label: 'Happy Creators' },
  { value: '99.9%', label: 'Uptime' },
  { value: '< 2min', label: 'Avg Generation Time' },
];

export default function HomePage() {
  const router = useRouter();

  // Navigation function using window.location for static export compatibility
  const handleNavClick = (href: string, label: string) => {
    console.log(`[NAV DEBUG] Clicked: ${label}, href: ${href}`);
    console.log(`[NAV DEBUG] Current URL: ${window.location.href}`);
    // Use window.location for reliable navigation in static export
    window.location.href = href;
  };

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />

        <div className="container mx-auto px-4 py-24 md:py-32 relative">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-6 px-4 py-1">
              <Sparkles className="w-3 h-3 mr-1" />
              Powered by Sora 2 & Veo 3
            </Badge>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent">
              Create AI Videos in Seconds
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Transform your ideas into stunning videos, images, and music with the power of AI. No experience needed.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-lg px-8"
                onClick={() => handleNavClick('/signup/', 'Start Creating Free')}
              >
                Start Creating Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8"
                onClick={() => {
                  console.log('[NAV DEBUG] Clicked: See Examples, scrolling to #features');
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <Play className="mr-2 h-5 w-5" />
                See Examples
              </Button>
            </div>

            <p className="text-sm text-muted-foreground mt-6">
              No credit card required • 60 free credits on signup
            </p>
          </div>

          {/* Video showcase placeholder */}
          <div className="mt-16 relative max-w-5xl mx-auto">
            <div className="aspect-video rounded-xl bg-gradient-to-br from-card to-muted border border-border overflow-hidden shadow-2xl">
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                    <Play className="w-8 h-8 text-primary ml-1" />
                  </div>
                  <p className="text-muted-foreground">Demo video coming soon</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-border bg-card/50">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Features</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to Create
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From text-to-video to AI music generation, Klipx has all the tools you need to bring your creative vision to life.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.name} className="group hover:border-primary/50 transition-all">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle>{feature.name}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Klipx Section */}
      <section className="py-24 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Why Klipx</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Built for Creators Like You
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
              <p className="text-muted-foreground">
                Generate videos in under 2 minutes with our optimized AI pipeline.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Enterprise Quality</h3>
              <p className="text-muted-foreground">
                Access the same AI models used by Hollywood studios and top agencies.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Always Available</h3>
              <p className="text-muted-foreground">
                99.9% uptime with 24/7 access to all creation tools.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Pricing</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Start free, upgrade when you need more. No hidden fees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingTiers.map((tier) => (
              <Card
                key={tier.name}
                className={tier.highlighted ? 'border-primary shadow-lg shadow-primary/20 scale-105' : ''}
              >
                {tier.highlighted && (
                  <div className="bg-primary text-primary-foreground text-center py-1 text-sm font-medium">
                    Most Popular
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{tier.name}</CardTitle>
                  <CardDescription>{tier.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{tier.price}</span>
                    <span className="text-muted-foreground">{tier.period}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                      className={`w-full ${tier.highlighted ? 'bg-gradient-to-r from-primary to-accent hover:opacity-90' : ''}`}
                      variant={tier.highlighted ? 'default' : 'outline'}
                      onClick={() => handleNavClick(tier.href, tier.cta)}
                    >
                      {tier.cta}
                    </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-primary/20 to-accent/20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Create Something Amazing?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of creators who are already using Klipx to bring their ideas to life.
          </p>
          <Button
            size="lg"
            className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-lg px-8"
            onClick={() => handleNavClick('/signup/', 'Get Started Free (CTA)')}
          >
            Get Started Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            60 free credits • No credit card required
          </p>
        </div>
      </section>
    </div>
  );
}
