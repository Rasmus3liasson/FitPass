#!/bin/bash

echo "🔍 Finding and fixing all import errors..."

# Navigate to project root
cd "$(dirname "$0")/.."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: Fixing imports in apps/mobile/app/**${NC}"
cd apps/mobile
find app -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' \
  -e 's|from ["'\''"]@/components/|from "@shared/components/|g' \
  -e 's|from ["'\''"]@/hooks/|from "@shared/hooks/|g' \
  -e 's|from ["'\''"]@/utils/|from "@shared/utils/|g' \
  -e 's|from ["'\''"]@/types/|from "@shared/types/|g' \
  -e 's|from ["'\''"]@/services/|from "@shared/services/|g' \
  -e 's|from ["'\''"]@/lib/|from "@shared/lib/|g' \
  -e 's|from ["'\''"]@/config/|from "@shared/config/|g' \
  -e 's|from ["'\''"]@/src/hooks/|from "@shared/hooks/|g' \
  -e 's|from ["'\''"]@/src/components/|from "@shared/components/|g' \
  -e 's|from ["'\''"]@/src/utils/|from "@shared/utils/|g' \
  -e 's|from ["'\''"]@/src/types/|from "@shared/types/|g' \
  -e 's|from ["'\''"]@/src/services/|from "@shared/services/|g' \
  -e 's|from ["'\''"]@/src/lib/|from "@shared/lib/|g' \
  -e 's|from ["'\''"]@/src/config/|from "@shared/config/|g' \
  -e 's|from ["'\''"]@/src/constants/|from "@/constants/|g' \
  -e 's|from ["'\''"]@/constants/|from "@/constants/|g' \
  -e 's|from ["'\''"]@/src/|from "@shared/|g' \
  {} +

echo -e "${GREEN}✅ Fixed imports in mobile app${NC}"

echo -e "${YELLOW}Step 2: Fixing imports in packages/shared/src/**${NC}"
cd ../../packages/shared/src

# Fix component-to-component imports
find components -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' \
  -e 's|from ["'\''"]@/components/\([^"'\'']*\)|from "../\1|g' \
  -e 's|from ["'\''"]@/utils/|from "../../utils/|g' \
  -e 's|from ["'\''"]@/types/|from "../../types/|g' \
  -e 's|from ["'\''"]@/lib/|from "../../lib/|g' \
  -e 's|from ["'\''"]@/config/|from "../../config/|g' \
  -e 's|from ["'\''"]@/constants/|from "../../constants/|g' \
  -e 's|from ["'\''"]../constants/|from "../../constants/|g' \
  {} +

# Fix hook-to-hook imports
find hooks -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' \
  -e 's|from ["'\''"]@/hooks/|from "../|g' \
  -e 's|from ["'\''"]@/utils/|from "../../utils/|g' \
  -e 's|from ["'\''"]@/types/|from "../../types/|g' \
  -e 's|from ["'\''"]@/services/|from "../../services/|g' \
  -e 's|from ["'\''"]@/lib/|from "../../lib/|g' \
  -e 's|from ["'\''"]@/config/|from "../../config/|g' \
  {} +

# Fix service imports
find services -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' \
  -e 's|from ["'\''"]@/services/|from "../|g' \
  -e 's|from ["'\''"]@/types/|from "../../types/|g' \
  -e 's|from ["'\''"]@/lib/|from "../../lib/|g' \
  -e 's|from ["'\''"]@/utils/|from "../../utils/|g' \
  {} +

# Fix utils imports
find utils -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' \
  -e 's|from ["'\''"]@/utils/|from "../|g' \
  -e 's|from ["'\''"]@/types/|from "../../types/|g' \
  {} +

echo -e "${GREEN}✅ Fixed imports in shared package${NC}"

echo -e "${YELLOW}Step 3: Checking for remaining @/ imports...${NC}"
cd ../../..
REMAINING=$(find apps/mobile/app packages/shared/src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec grep -l 'from ["'\''"]@/' {} + 2>/dev/null | wc -l)

if [ "$REMAINING" -gt 0 ]; then
  echo -e "${YELLOW}⚠️  Found $REMAINING files with remaining @/ imports:${NC}"
  find apps/mobile/app packages/shared/src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec grep -l 'from ["'\''"]@/' {} + 2>/dev/null
else
  echo -e "${GREEN}✅ No remaining @/ imports found!${NC}"
fi

echo -e "${GREEN}🎉 Import fixing complete!${NC}"
