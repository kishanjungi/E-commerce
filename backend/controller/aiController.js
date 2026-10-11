import ai from "../config/gemini.js";
import productModel from "../models/productModel.js";

const testGemini = async (req, res) => {
    try {
        const { query } = req.body;

        if (!query) {
            return res.json({
                success: false,
                message: "Search query is required"
            });
        }

        const response = await ai.models.generateContent({
            model: "gemini-3.5-flash-lite",

            contents: `

You are an AI search assistant for a clothing e-commerce website.

Analyze the customer's query and extract shopping filters.

Customer query:
"${query}"

Return ONLY valid JSON in exactly this format:
{
  "searchText": "",
  "category": "",
  "subCategory": "",
  "maxPrice": null,
  "size": ""
}

Rules:
1. searchText: Extract the product name or descriptive keywords.
   Examples: "t-shirt", "black shirt", "cotton top", "blue jeans".
2. category: Use ONLY "Men", "Women", or "Kids" if clearly indicated.
   Otherwise return an empty string.
3. subCategory: Use ONLY "Topwear", "Bottomwear", or "Winterwear"
   if clearly indicated by the query.
   Examples:
   - t-shirt, shirt, top -> "Topwear"
   - jeans, trousers, shorts -> "Bottomwear"
   - jacket, sweater, hoodie -> "Winterwear"
   If unclear, return an empty string.
4. maxPrice: Extract the maximum budget as a number.
   If no budget is mentioned, return null.
5. size: Extract S, M, L, XL, or XXL if specified.
   Otherwise return an empty string.
6. Do not infer Men or Women from the product name alone.
7. Do not invent filters.
8. Return ONLY valid JSON without Markdown.

`
        });

        let result = response.text;

        // Remove markdown code fences if Gemini adds them
        result = result
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        const searchData = JSON.parse(result);
        // Build MongoDB filters using the AI output
        const filter = {};

        if (searchData.maxPrice !== null &&
            typeof searchData.maxPrice === "number") {
            filter.price = { $lte: searchData.maxPrice };
        }

        if (searchData.category) {
            filter.category = {
                $regex: searchData.category,
                $options: "i"
            };
        }

        if (searchData.subCategory) {
            filter.subCategory = {
                $regex: searchData.subCategory,
                $options: "i"
            };
        }

        if (searchData.size) {
            filter.sizes = {
                $regex: `^${searchData.size}$`,
                $options: "i"
            };
        }

        // Search product names and descriptions
        if (searchData.searchText) {
            const keywords = searchData.searchText
                .trim()
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 8);

            if (keywords.length > 0) {
                filter.$and = keywords.map(keyword => ({
                    $or: [
                        { name: { $regex: keyword, $options: "i" } },
                        { description: { $regex: keyword, $options: "i" } }
                    ]
                }));
            }
        }

        const products = await productModel
            .find(filter)
            .limit(30)
            .lean();

        res.json({
            success: true,
            query,
            searchData,
            products,
            count: products.length
        });

    } catch (error) {

        console.log("Gemini Error:", error);

        res.json({
            success: false,
            message: error.message
        });
    }
};

export { testGemini };