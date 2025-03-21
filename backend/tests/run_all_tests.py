# backend/tests/run_all_tests.py
import unittest
import os
import sys

# เพิ่มพาธของโปรเจกต์เพื่อให้ import โมดูลได้
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# โหลดทุกการทดสอบ
from tests.test_pythainlp import TestPyThaiNLP
from tests.test_pdf_multilingual import TestPDFMultilingual
from tests.test_hybrid_search import TestHybridSearch
from tests.test_reranking import TestReranking
from tests.test_rag_performance import TestRAGPerformance

if __name__ == '__main__':
    # สร้าง test suite
    suite = unittest.TestSuite()
    
    # เพิ่มการทดสอบต่างๆ
    suite.addTest(unittest.makeSuite(TestPyThaiNLP))
    suite.addTest(unittest.makeSuite(TestPDFMultilingual))
    suite.addTest(unittest.makeSuite(TestHybridSearch))
    suite.addTest(unittest.makeSuite(TestReranking))
    suite.addTest(unittest.makeSuite(TestRAGPerformance))
    
    # รันการทดสอบทั้งหมด
    runner = unittest.TextTestRunner(verbosity=2)
    runner.run(suite)