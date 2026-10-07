import { useState, useEffect } from 'react';
import Hero from '../../components/Hero';
import Stats from '../../components/Stats';
import StemDisciplines from '../../components/StemDisciplines';
import Comparison from '../../components/Comparison';
import HowItWorks from '../../components/HowItWorks';
import FeatureGrid from '../../components/FeatureGrid';
import AiSection from '../../components/AiSection';
import ResearchSection from '../../components/ResearchSection';
import TeacherSection from '../../components/TeacherSection';
import Testimonials from '../../components/Testimonials';
import Faq from '../../components/Faq';
import CTA from '../../components/CTA';
import { pageService } from '../../services/api';

export default function Home() {
  const [content, setContent] = useState(null);

  useEffect(() => {
    const loadHomeContent = async () => {
      try {
        const res = await pageService.getPageContent('home');
        if (res.data?.success && res.data.data) {
          setContent(res.data.data);
        }
      } catch (e) {
        // Fallback to component defaults
      }
    };
    loadHomeContent();
  }, []);

  return (
    <div className="w-full">
      <Hero content={content} />
      <Stats content={content} />
      <StemDisciplines />
      <Comparison />
      <HowItWorks />
      <FeatureGrid />
      <AiSection />
      <ResearchSection />
      <TeacherSection />
      <Testimonials />
      <Faq />
      <CTA content={content} />
    </div>
  );
}

