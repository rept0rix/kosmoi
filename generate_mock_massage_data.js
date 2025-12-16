function generateMockMassageData() {
  const data = [];
  for (let i = 0; i < 10; i++) {
    const business_name = `Samui Spa #${i + 1}`;
    const description = `A relaxing spa experience in Koh Samui. ${i % 2 === 0 ? 'Specializing in Thai massage.' : 'Offering a variety of treatments.'}`;
    const price_range = i % 3 === 0 ? '$$' : i % 3 === 1 ? '$$$' : '$';
    const location = `123 Main St, Koh Samui ${i + 1}`;
    data.push({
      business_name,
      description,
      price_range,
      location,
    });
  }
  return JSON.stringify(data, null, 2);
}

console.log(generateMockMassageData());