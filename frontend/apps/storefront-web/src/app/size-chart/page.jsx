'use client';

import Image from 'next/image';
import Nav from '@/components/Nav/Nav';
import Footer from '@/components/Footer/Footer';
import styles from '../info.module.css';

export default function SizeChartPage() {
  return (
    <>
      <Nav />
      <main className={styles.main}>
        {/* Watermarks */}
        <Image
          src="/images/emoji.png"
          alt=""
          width={800}
          height={800}
          className={`${styles.watermark} ${styles.watermark1}`}
          unoptimized={true}
        />
        <Image
          src="/images/emoji.png"
          alt=""
          width={800}
          height={800}
          className={`${styles.watermark} ${styles.watermark2}`}
          unoptimized={true}
        />
        <Image
          src="/images/emoji.png"
          alt=""
          width={800}
          height={800}
          className={`${styles.watermark} ${styles.watermark3}`}
          unoptimized={true}
        />
        <div className={styles.container}>
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <a href="/">Home</a>
            <span className={styles.breadcrumbSep} aria-hidden="true">›</span>
            <span>Size Chart</span>
          </nav>
          <h1 className={styles.heading}>Size Chart</h1>
          <div className={styles.card}>
            <p className={styles.text}>At RedAvo Activewear we use the UK size guide. We usually have sizes XS to 4XL for leggings, sports bras, and t-shirts. If you're not sure of your sizing, we encourage you to come in-store so we can assist you with your sizing.</p>
            <p className={styles.text} style={{marginTop: '1rem'}}>Be kind to yourself when it comes to sizing. As women we tend to size ourselves one or two sizes bigger, all thanks 🫣😒 to the unrealistic societal pressures of trying to make women feel uncomfortable and self-hate our imperfectly perfect beautiful shapes, sizes, curves and everything in-between.</p>

            <div className={styles.section} style={{marginTop: '2rem'}}>
              <h2 className={styles.sectionHeading}>UK Women’s Size Guide: XS - 4XL</h2>
              
              <h3 style={{marginTop: '1.5rem', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '1.1rem'}}>How to measure</h3>
              <ol className={styles.text} style={{paddingLeft: '1.5rem', marginBottom: '2rem', listStyleType: 'decimal'}}>
                <li style={{marginBottom: '0.25rem'}}><strong>Bust/Chest:</strong> Around fullest part, wearing a well-fitting bra</li>
                <li style={{marginBottom: '0.25rem'}}><strong>Underbust:</strong> Directly under bust, where bra band sits</li>
                <li style={{marginBottom: '0.25rem'}}><strong>Waist:</strong> Narrowest part of waist</li>
                <li style={{marginBottom: '0.25rem'}}><strong>Hips/Seat:</strong> Fullest part of hips</li>
                <li><strong>Inner leg:</strong> Top of inside leg to ankles</li>
              </ol>

              <h3 style={{marginTop: '2rem', marginBottom: '1rem', fontWeight: 'bold', fontSize: '1.1rem'}}>1. UK Size Conversion</h3>
              <div style={{overflowX: 'auto'}}>
                <table style={{width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginBottom: '2rem'}} className={styles.text}>
                  <thead>
                    <tr style={{borderBottom: '1px solid #ccc'}}>
                      <th style={{padding: '0.5rem'}}>Alpha</th>
                      <th style={{padding: '0.5rem'}}>UK</th>
                      <th style={{padding: '0.5rem'}}>US</th>
                      <th style={{padding: '0.5rem'}}>EU</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{borderBottom: '1px solid #eee'}}><td style={{padding: '0.5rem'}}>XS</td><td style={{padding: '0.5rem'}}>6</td><td style={{padding: '0.5rem'}}>2</td><td style={{padding: '0.5rem'}}>32</td></tr>
                    <tr style={{borderBottom: '1px solid #eee'}}><td style={{padding: '0.5rem'}}>S</td><td style={{padding: '0.5rem'}}>8-10</td><td style={{padding: '0.5rem'}}>4-6</td><td style={{padding: '0.5rem'}}>34-36</td></tr>
                    <tr style={{borderBottom: '1px solid #eee'}}><td style={{padding: '0.5rem'}}>M</td><td style={{padding: '0.5rem'}}>12-14</td><td style={{padding: '0.5rem'}}>8-10</td><td style={{padding: '0.5rem'}}>38-40</td></tr>
                    <tr style={{borderBottom: '1px solid #eee'}}><td style={{padding: '0.5rem'}}>L</td><td style={{padding: '0.5rem'}}>16-18</td><td style={{padding: '0.5rem'}}>12-14</td><td style={{padding: '0.5rem'}}>42-44</td></tr>
                    <tr style={{borderBottom: '1px solid #eee'}}><td style={{padding: '0.5rem'}}>XL</td><td style={{padding: '0.5rem'}}>18-20</td><td style={{padding: '0.5rem'}}>14-16</td><td style={{padding: '0.5rem'}}>44-46</td></tr>
                    <tr style={{borderBottom: '1px solid #eee'}}><td style={{padding: '0.5rem'}}>2XL</td><td style={{padding: '0.5rem'}}>20-22</td><td style={{padding: '0.5rem'}}>16-18</td><td style={{padding: '0.5rem'}}>46-48</td></tr>
                    <tr style={{borderBottom: '1px solid #eee'}}><td style={{padding: '0.5rem'}}>3XL</td><td style={{padding: '0.5rem'}}>22-24</td><td style={{padding: '0.5rem'}}>18-20</td><td style={{padding: '0.5rem'}}>48-50</td></tr>
                    <tr style={{borderBottom: '1px solid #eee'}}><td style={{padding: '0.5rem'}}>4XL</td><td style={{padding: '0.5rem'}}>24-26</td><td style={{padding: '0.5rem'}}>20-22</td><td style={{padding: '0.5rem'}}>50-52</td></tr>
                  </tbody>
                </table>
              </div>

              <h3 style={{marginTop: '2rem', marginBottom: '1rem', fontWeight: 'bold', fontSize: '1.1rem'}}>2. T-Shirts / Tops</h3>
              <div style={{overflowX: 'auto'}}>
                <table style={{width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginBottom: '2rem'}} className={styles.text}>
                  <thead>
                    <tr style={{borderBottom: '1px solid #ccc'}}>
                      <th style={{padding: '0.5rem'}}>Size</th>
                      <th style={{padding: '0.5rem'}}>UK</th>
                      <th style={{padding: '0.5rem'}}>Bust (cm)</th>
                      <th style={{padding: '0.5rem'}}>Waist (cm)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{borderBottom: '1px solid #eee'}}><td style={{padding: '0.5rem'}}>XS</td><td style={{padding: '0.5rem'}}>6</td><td style={{padding: '0.5rem'}}>78 - 81</td><td style={{padding: '0.5rem'}}>64 - 67</td></tr>
                    <tr style={{borderBottom: '1px solid #eee'}}><td style={{padding: '0.5rem'}}>S</td><td style={{padding: '0.5rem'}}>8/10</td><td style={{padding: '0.5rem'}}>82 - 90</td><td style={{padding: '0.5rem'}}>68 - 74</td></tr>
                    <tr style={{borderBottom: '1px solid #eee'}}><td style={{padding: '0.5rem'}}>M</td><td style={{padding: '0.5rem'}}>12/14</td><td style={{padding: '0.5rem'}}>86 - 94</td><td style={{padding: '0.5rem'}}>71 - 78</td></tr>
                    <tr style={{borderBottom: '1px solid #eee'}}><td style={{padding: '0.5rem'}}>L</td><td style={{padding: '0.5rem'}}>14/16</td><td style={{padding: '0.5rem'}}>90 - 97</td><td style={{padding: '0.5rem'}}>75 - 82</td></tr>
                    <tr style={{borderBottom: '1px solid #eee'}}><td style={{padding: '0.5rem'}}>XL</td><td style={{padding: '0.5rem'}}>18</td><td style={{padding: '0.5rem'}}>98 - 102</td><td style={{padding: '0.5rem'}}>83 - 87</td></tr>
                    <tr style={{borderBottom: '1px solid #eee'}}><td style={{padding: '0.5rem'}}>2XL</td><td style={{padding: '0.5rem'}}>20</td><td style={{padding: '0.5rem'}}>103 - 109</td><td style={{padding: '0.5rem'}}>88 - 94</td></tr>
                    <tr style={{borderBottom: '1px solid #eee'}}><td style={{padding: '0.5rem'}}>3XL</td><td style={{padding: '0.5rem'}}>22</td><td style={{padding: '0.5rem'}}>110 - 115</td><td style={{padding: '0.5rem'}}>95 - 101</td></tr>
                    <tr style={{borderBottom: '1px solid #eee'}}><td style={{padding: '0.5rem'}}>4XL</td><td style={{padding: '0.5rem'}}>24</td><td style={{padding: '0.5rem'}}>116 - 121</td><td style={{padding: '0.5rem'}}>102 - 108</td></tr>
                  </tbody>
                </table>
              </div>

              <h3 style={{marginTop: '2rem', marginBottom: '1rem', fontWeight: 'bold', fontSize: '1.1rem'}}>3. Sports Bras - Measurement Method</h3>
              <div style={{overflowX: 'auto'}}>
                <table style={{width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginBottom: '2rem'}} className={styles.text}>
                  <thead>
                    <tr style={{borderBottom: '1px solid #ccc'}}>
                      <th style={{padding: '0.5rem'}}>Size</th>
                      <th style={{padding: '0.5rem'}}>UK</th>
                      <th style={{padding: '0.5rem'}}>Underbust (cm)</th>
                      <th style={{padding: '0.5rem'}}>Overbust (cm)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{borderBottom: '1px solid #eee'}}><td style={{padding: '0.5rem'}}>XS</td><td style={{padding: '0.5rem'}}>6</td><td style={{padding: '0.5rem'}}>70</td><td style={{padding: '0.5rem'}}>82</td></tr>
                    <tr style={{borderBottom: '1px solid #eee'}}><td style={{padding: '0.5rem'}}>S</td><td style={{padding: '0.5rem'}}>8/10</td><td style={{padding: '0.5rem'}}>75</td><td style={{padding: '0.5rem'}}>87</td></tr>
                    <tr style={{borderBottom: '1px solid #eee'}}><td style={{padding: '0.5rem'}}>M</td><td style={{padding: '0.5rem'}}>10/12</td><td style={{padding: '0.5rem'}}>80</td><td style={{padding: '0.5rem'}}>92</td></tr>
                    <tr style={{borderBottom: '1px solid #eee'}}><td style={{padding: '0.5rem'}}>L</td><td style={{padding: '0.5rem'}}>12/14</td><td style={{padding: '0.5rem'}}>85</td><td style={{padding: '0.5rem'}}>97</td></tr>
                    <tr style={{borderBottom: '1px solid #eee'}}><td style={{padding: '0.5rem'}}>XL</td><td style={{padding: '0.5rem'}}>14/16</td><td style={{padding: '0.5rem'}}>90</td><td style={{padding: '0.5rem'}}>102</td></tr>
                    <tr style={{borderBottom: '1px solid #eee'}}><td style={{padding: '0.5rem'}}>2X</td><td style={{padding: '0.5rem'}}>16/18</td><td style={{padding: '0.5rem'}}>95+</td><td style={{padding: '0.5rem'}}>107+</td></tr>
                    <tr style={{borderBottom: '1px solid #eee'}}><td style={{padding: '0.5rem'}}>3X</td><td style={{padding: '0.5rem'}}>20</td><td style={{padding: '0.5rem'}}>100+</td><td style={{padding: '0.5rem'}}>112+</td></tr>
                    <tr style={{borderBottom: '1px solid #eee'}}><td style={{padding: '0.5rem'}}>4X</td><td style={{padding: '0.5rem'}}>22</td><td style={{padding: '0.5rem'}}>105+</td><td style={{padding: '0.5rem'}}>117+</td></tr>
                  </tbody>
                </table>
              </div>

              <h3 style={{marginTop: '2rem', marginBottom: '1rem', fontWeight: 'bold', fontSize: '1.1rem'}}>3b. Sports Bras - Alpha + Cup Method</h3>
              <div style={{overflowX: 'auto'}}>
                <table style={{width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginBottom: '2rem'}} className={styles.text}>
                  <thead>
                    <tr style={{borderBottom: '1px solid #ccc'}}>
                      <th style={{padding: '0.5rem'}}>Alpha</th>
                      <th style={{padding: '0.5rem'}}>UK Band</th>
                      <th style={{padding: '0.5rem'}}>Cup range</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{borderBottom: '1px solid #eee'}}><td style={{padding: '0.5rem'}}>XS</td><td style={{padding: '0.5rem'}}>30-32</td><td style={{padding: '0.5rem'}}>A-E</td></tr>
                    <tr style={{borderBottom: '1px solid #eee'}}><td style={{padding: '0.5rem'}}>S</td><td style={{padding: '0.5rem'}}>34-36</td><td style={{padding: '0.5rem'}}>A-E</td></tr>
                    <tr style={{borderBottom: '1px solid #eee'}}><td style={{padding: '0.5rem'}}>M</td><td style={{padding: '0.5rem'}}>36-38</td><td style={{padding: '0.5rem'}}>A-E</td></tr>
                    <tr style={{borderBottom: '1px solid #eee'}}><td style={{padding: '0.5rem'}}>L</td><td style={{padding: '0.5rem'}}>38-40</td><td style={{padding: '0.5rem'}}>A-E</td></tr>
                    <tr style={{borderBottom: '1px solid #eee'}}><td style={{padding: '0.5rem'}}>XL</td><td style={{padding: '0.5rem'}}>40-42</td><td style={{padding: '0.5rem'}}>A-E</td></tr>
                    <tr style={{borderBottom: '1px solid #eee'}}><td style={{padding: '0.5rem'}}>1X</td><td style={{padding: '0.5rem'}}>42</td><td style={{padding: '0.5rem'}}>D-G</td></tr>
                    <tr style={{borderBottom: '1px solid #eee'}}><td style={{padding: '0.5rem'}}>2X</td><td style={{padding: '0.5rem'}}>44</td><td style={{padding: '0.5rem'}}>D-G</td></tr>
                    <tr style={{borderBottom: '1px solid #eee'}}><td style={{padding: '0.5rem'}}>3X</td><td style={{padding: '0.5rem'}}>46</td><td style={{padding: '0.5rem'}}>E-G</td></tr>
                    <tr style={{borderBottom: '1px solid #eee'}}><td style={{padding: '0.5rem'}}>4X</td><td style={{padding: '0.5rem'}}>48</td><td style={{padding: '0.5rem'}}>E-G</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
